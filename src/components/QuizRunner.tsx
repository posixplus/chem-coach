"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSpeech } from "./useSpeech";
import MathText from "./MathText";
import GraphView from "./GraphView";
import MathInput, { type MathInputHandle } from "./MathInput";
import DesmosSketch from "./DesmosSketch";
import type { AnswerKind, GraphSpec } from "@/lib/supabase";

type ClientQuestion = {
  id: string;
  topic_id: string;
  topic_name: string;
  qtype: "mcq" | "numeric" | "short" | "flashcard" | "math" | "sketch";
  prompt: string;
  choices: string[] | null;
  answer_unit: string | null;
  sig_figs: number | null;
  difficulty: number;
  isReview: boolean;
  graph: GraphSpec | null;
  calc: "calc" | "no-calc" | null;
  kind: AnswerKind | null;
  placeholder: string | null;
  choice_graphs: Record<string, GraphSpec> | null;
  desmos: { expressions: string[]; checklist: string[] } | null;
  subject: string;
};

/** Speech: read LaTeX in a way the Mac voice can say. */
function speakable(s: string) {
  return s
    .replace(/\$/g, "")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1 over $2")
    .replace(/\\sqrt\{([^}]*)\}/g, "square root of $1")
    .replace(/\\log_\{?(\w+)\}?/g, "log base $1 of")
    .replace(/\\circ/g, " composed with ")
    .replace(/\^\{?-1\}?/g, " inverse")
    .replace(/\^\{?2\}?/g, " squared")
    .replace(/\^\{?3\}?/g, " cubed")
    .replace(/\^\{?([^} ]+)\}?/g, " to the $1")
    .replace(/\\infty/g, "infinity")
    .replace(/\\(left|right|,|;|quad|cdot|times)/g, " ")
    .replace(/[{}\\]/g, "");
}

type AnswerResult = {
  correct: boolean;
  resolved: boolean; // no more tries on this question
  note?: string;
  feedback?: string; // short-answer grader feedback
  remediation?: string; // nudge or explanation text
  stage?: "nudge" | "explain";
  correctAnswer?: string;
  answerTex?: string;
  explanation?: string;
};

type Phase = "loading" | "answering" | "retry" | "resolved" | "done" | "error";

export default function QuizRunner({ topicId, title, studentName }: { topicId: string; title: string; studentName: string }) {
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [answer, setAnswer] = useState("");
  const [tries, setTries] = useState<string[]>([]);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState({ correct: 0, firstTry: 0, total: 0 });
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");
  const [askReply, setAskReply] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sessionId = useRef<string | null>(null);
  const lastActivity = useRef(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const mathRef = useRef<MathInputHandle>(null);
  const [revealed, setRevealed] = useState(false);
  const speech = useSpeech();

  const q = questions[idx];

  // Session + heartbeat (counts only while tab is visible and the student did something in the last 2 minutes).
  useEffect(() => {
    let alive = true;
    lastActivity.current = Date.now();
    const bump = () => (lastActivity.current = Date.now());
    window.addEventListener("keydown", bump);
    window.addEventListener("pointerdown", bump);
    (async () => {
      const r = await fetch("/api/session/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topicId }) });
      if (!r.ok) return;
      const j = await r.json();
      if (alive) sessionId.current = j.id;
    })();
    const iv = setInterval(() => {
      if (!sessionId.current) return;
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivity.current > 120_000) return;
      fetch("/api/session/heartbeat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: sessionId.current, seconds: 30 }) }).catch(() => {});
    }, 30_000);
    const end = () => {
      if (!sessionId.current) return;
      navigator.sendBeacon("/api/session/end", new Blob([JSON.stringify({ id: sessionId.current })], { type: "application/json" }));
    };
    window.addEventListener("pagehide", end);
    return () => {
      alive = false;
      clearInterval(iv);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("pagehide", end);
      end();
    };
  }, [topicId]);

  // Load questions.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/quiz/next?topic=${encodeURIComponent(topicId)}&n=10`);
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json();
        setQuestions(j.questions);
        setPhase(j.questions.length ? "answering" : "done");
      } catch (e) {
        setErrorMsg(String(e));
        setPhase("error");
      }
    })();
  }, [topicId]);

  // Auto-read the question when it appears.
  useEffect(() => {
    if (q && phase === "answering" && speech.autoRead) {
      speech.speak(speakable(q.prompt) + (q.choices && !q.choice_graphs ? ". Choices: " + q.choices.map(speakable).join(". ") : ""));
    }
    inputRef.current?.focus();
    mathRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id, phase === "answering"]);

  const submit = useCallback(
    async (val?: string) => {
      const a = (val ?? answer).trim();
      if (!q || !a || busy) return;
      setBusy(true);
      const newTries = [...tries, a];
      setTries(newTries);
      try {
        const r = await fetch("/api/quiz/answer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId.current, questionId: q.id, answer: a, tries: newTries, hintUsed }),
        });
        if (!r.ok) throw new Error(await r.text());
        const j = (await r.json()) as AnswerResult;
        setResult(j);
        if (j.resolved) {
          setScore((s) => ({ correct: s.correct + (j.correct ? 1 : 0), firstTry: s.firstTry + (j.correct && newTries.length === 1 ? 1 : 0), total: s.total + 1 }));
          setPhase("resolved");
        } else {
          setPhase("retry");
          setAnswer("");
        }
        if (speech.autoRead && j.remediation) speech.speak(speakable(j.remediation));
        else if (speech.autoRead && j.correct) speech.speak("Correct. " + (j.note ?? ""));
      } catch (e) {
        setErrorMsg(String(e));
      } finally {
        setBusy(false);
      }
    },
    [answer, q, busy, tries, hintUsed, speech],
  );

  const next = () => {
    speech.stop();
    setResult(null);
    setTries([]);
    setAnswer("");
    setHint(null);
    setHintUsed(false);
    setAskOpen(false);
    setAskReply(null);
    setRevealed(false);
    if (idx + 1 >= questions.length) setPhase("done");
    else {
      setIdx(idx + 1);
      setPhase("answering");
    }
  };

  const getHint = async () => {
    if (!q) return;
    setHintUsed(true);
    const r = await fetch(`/api/quiz/hint?id=${q.id}`);
    const j = await r.json();
    setHint(j.hint || "No hint for this one. Think about where you start and where you need to end up.");
    if (speech.autoRead && j.hint) speech.speak(speakable(j.hint));
  };

  const ask = async () => {
    if (!q || !askText.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: q.id, question: askText, tries }),
      });
      const j = await r.json();
      setAskReply(j.answer);
      if (speech.autoRead) speech.speak(speakable(j.answer));
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") return <p className="p-6 text-stone-500">Loading questions…</p>;
  if (phase === "error") return <p className="p-6 text-red-600">Could not load: {errorMsg}</p>;
  if (phase === "done") {
    const pct = score.total ? Math.round((100 * score.correct) / score.total) : 0;
    return (
      <div className="card space-y-3 text-center">
        <h2 className="text-2xl font-semibold">{score.total ? `Done, ${studentName}.` : "Nothing to review right now."}</h2>
        {score.total > 0 && (
          <p className="text-stone-600">
            {score.correct} of {score.total} correct ({pct}%), {score.firstTry} on the first try.
            {pct >= 80 ? " Solid." : pct >= 60 ? " Getting there. The misses come back as fresh versions in about 10 minutes." : " Rough set. Read the explanations, then run this topic again."}
          </p>
        )}
        <div className="flex justify-center gap-2">
          <button className="btn-primary" onClick={() => location.reload()}>Another set</button>
          <Link href="/study" className="btn-secondary">Back to topics</Link>
        </div>
      </div>
    );
  }
  if (!q) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          {title} · {idx + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-2">
          {speech.supported.tts && (
            <button className={`btn-ghost ${speech.autoRead ? "text-emerald-700" : ""}`} onClick={speech.toggleAutoRead} title="Read questions and feedback aloud">
              {speech.autoRead ? "Read aloud: on" : "Read aloud: off"}
            </button>
          )}
          {speech.supported.tts && (
            <button className="btn-ghost" onClick={() => (speech.speaking ? speech.stop() : speech.speak(speakable(q.prompt) + (q.choices && !q.choice_graphs ? ". Choices: " + q.choices.map(speakable).join(". ") : "")))} title="Read this question">
              {speech.speaking ? "Stop" : "Speak"}
            </button>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="rounded bg-stone-100 px-2 py-0.5">{q.topic_name}</span>
          {q.isReview && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Review</span>}
          {q.calc === "no-calc" && <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-800">No calculator</span>}
          {q.calc === "calc" && <span className="rounded bg-sky-50 px-2 py-0.5 text-sky-800">TI-84 allowed</span>}
          <span>{"●".repeat(q.difficulty)}{"○".repeat(4 - q.difficulty)}</span>
        </div>
        <MathText as="p" className="text-lg leading-relaxed whitespace-pre-wrap" text={q.prompt} />
        {q.graph && (q.qtype !== "sketch" || revealed) && (
          <div className="flex justify-center">
            <GraphView spec={q.graph} />
          </div>
        )}

        {phase !== "resolved" && (
          <>
            {q.qtype === "sketch" && q.desmos ? (
              <div className="space-y-3">
                <DesmosSketch expressions={q.desmos.expressions} checklist={q.desmos.checklist} revealed={revealed} onReveal={() => setRevealed(true)} />
                {revealed && (
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-primary" disabled={busy} onClick={() => submit("got-it")}>My sketch matches</button>
                    <button className="btn-secondary" disabled={busy} onClick={() => submit("missed")}>I missed something</button>
                  </div>
                )}
              </div>
            ) : q.qtype === "mcq" && q.choices && q.choice_graphs ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {q.choices.map((c) => (
                  <button
                    key={c}
                    disabled={busy || tries.includes(c)}
                    onClick={() => submit(c)}
                    className={`rounded-lg border p-2 text-left transition hover:border-emerald-600 ${tries.includes(c) ? "border-red-300 bg-red-50 opacity-60" : "border-stone-300 bg-white"}`}
                  >
                    <span className="text-sm font-semibold">{c}</span>
                    {q.choice_graphs![c] && <GraphView spec={q.choice_graphs![c]} size={260} className="w-full" />}
                  </button>
                ))}
              </div>
            ) : q.qtype === "mcq" && q.choices ? (
              <div className="grid gap-2">
                {q.choices.map((c) => (
                  <button
                    key={c}
                    disabled={busy || tries.includes(c)}
                    onClick={() => submit(c)}
                    className={`rounded-lg border px-4 py-3 text-left transition hover:border-emerald-600 ${tries.includes(c) ? "border-red-300 bg-red-50 line-through" : "border-stone-300 bg-white"}`}
                  >
                    <MathText text={c} />
                  </button>
                ))}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="space-y-2"
              >
                {q.qtype === "math" && q.kind && q.kind !== "text" ? (
                  <MathInput ref={mathRef} value={answer} onChange={setAnswer} kind={q.kind} disabled={busy} placeholder={q.placeholder} />
                ) : q.qtype === "short" || (q.qtype === "math" && q.kind === "text") ? (
                  <textarea ref={(el) => { inputRef.current = el; }} className="input min-h-24" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer (a sentence or two)" disabled={busy} />
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={(el) => { inputRef.current = el; }}
                      className="input"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={q.qtype === "numeric" ? "Number (e.g. 0.0454 or 3.98e8)" : "Your answer"}
                      disabled={busy}
                      autoComplete="off"
                    />
                    {q.answer_unit && <span className="shrink-0 text-stone-500">{q.answer_unit}</span>}
                  </div>
                )}
                {q.sig_figs && q.qtype === "numeric" && <p className="text-xs text-stone-500">Report with correct sig figs. Enter just the number.</p>}
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary" type="submit" disabled={busy || !answer.trim()}>
                    {busy ? "Checking…" : "Check"}
                  </button>
                  {speech.supported.stt && q.qtype !== "math" && (
                    <button type="button" className={`btn-secondary ${speech.listening ? "border-red-400 text-red-700" : ""}`} onClick={() => speech.listen((t) => setAnswer(t))}>
                      {speech.listening ? "Listening… (tap to stop)" : "Speak answer"}
                    </button>
                  )}
                  {!hint && (
                    <button type="button" className="btn-ghost" onClick={getHint} disabled={busy}>
                      Hint
                    </button>
                  )}
                </div>
              </form>
            )}
            {q.qtype === "mcq" && !hint && (
              <button type="button" className="btn-ghost" onClick={getHint} disabled={busy}>
                Hint
              </button>
            )}
          </>
        )}

        {hint && phase !== "resolved" && (
          <div className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
            <span className="font-medium">Hint: </span>
            <MathText text={hint} />
          </div>
        )}

        {result && phase === "retry" && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Not quite. One more try.</p>
            {result.note && <p className="mt-1">{result.note}</p>}
            {result.feedback && !result.remediation && <p className="mt-1">{result.feedback}</p>}
            {result.remediation && <MathText as="p" className="mt-2 whitespace-pre-wrap" text={result.remediation} />}
          </div>
        )}

        {result && phase === "resolved" && (
          <div className={`rounded-lg p-3 text-sm ${result.correct ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
            <p className="font-medium">
              {q.qtype === "sketch"
                ? result.correct
                  ? "Nice sketch."
                  : "Worth another look. Compare feature by feature."
                : result.correct
                  ? tries.length === 1
                    ? "Correct, first try."
                    : "Correct on the retry."
                  : "Still not it."}
            </p>
            {result.note && <p className="mt-1">{result.note}</p>}
            {result.feedback && <p className="mt-1">{result.feedback}</p>}
            {!result.correct && result.correctAnswer && q.qtype !== "sketch" && (
              <p className="mt-1">
                Answer: <MathText className="font-semibold" text={result.answerTex ? `$${result.answerTex}$` : result.correctAnswer} />
                {q.answer_unit ? ` ${q.answer_unit}` : ""}
              </p>
            )}
            {(result.remediation || result.explanation) && <MathText as="p" className="mt-2 whitespace-pre-wrap" text={result.remediation || result.explanation || ""} />}
            {!result.correct && q.qtype !== "sketch" && <p className="mt-2 text-xs opacity-80">A fresh version of this problem will come back in about 10 minutes and again later this week.</p>}
          </div>
        )}

        {phase === "resolved" && (
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={next} autoFocus>
              Next
            </button>
            <button className="btn-ghost" onClick={() => setAskOpen((v) => !v)}>
              Ask the tutor
            </button>
          </div>
        )}
        {phase === "retry" && (
          <button className="btn-ghost text-xs" onClick={() => setAskOpen((v) => !v)}>
            Ask the tutor a question
          </button>
        )}

        {askOpen && (
          <div className="space-y-2 rounded-lg border border-stone-200 p-3">
            <input className="input" value={askText} onChange={(e) => setAskText(e.target.value)} placeholder={q.subject === "math" ? "e.g. Why is this a hole and not an asymptote?" : "e.g. Why does the trailing zero count here?"} onKeyDown={(e) => e.key === "Enter" && ask()} />
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={ask} disabled={busy || !askText.trim()}>
                Ask
              </button>
              {speech.supported.stt && (
                <button className="btn-ghost" onClick={() => speech.listen((t) => setAskText(t))}>
                  {speech.listening ? "Listening…" : "Speak"}
                </button>
              )}
            </div>
            {askReply && <MathText as="p" className="whitespace-pre-wrap text-sm text-stone-800" text={askReply} />}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-stone-400">
        {score.total > 0 && `${score.correct}/${score.total} so far`}
      </p>
    </div>
  );
}
