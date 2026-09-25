import { NextResponse, after } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { getQuestion, getTopic } from "@/lib/questions";
import { gradeLocal } from "@/lib/grading";
import { gradeShortAnswer, remediate, generateQuestions } from "@/lib/claude";
import { nextReview } from "@/lib/srs";

const MAX_TRIES = 2;

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const profile = s.profile;
  const body = await req.json();
  const { sessionId, questionId, answer, hintUsed } = body as { sessionId: string | null; questionId: string; answer: string; tries: string[]; hintUsed: boolean };
  const tries: string[] = Array.isArray(body.tries) && body.tries.length ? body.tries : [answer];
  const q = await getQuestion(questionId);
  if (!q) return NextResponse.json({ error: "no such question" }, { status: 404 });
  const topic = (await getTopic(q.topic_id))!;

  let correct = false;
  let note: string | undefined;
  let feedback: string | undefined;
  const local = gradeLocal(q, answer);
  if (local) {
    correct = local.correct;
    note = local.note;
  } else {
    const g = await gradeShortAnswer(q, answer, topic);
    correct = g.correct;
    feedback = g.feedback;
  }

  const attemptNo = tries.length;
  const resolved = correct || attemptNo >= MAX_TRIES || q.qtype === "sketch";
  let remediation: string | undefined;
  let stage: "nudge" | "explain" | undefined;

  if (!correct && q.qtype !== "sketch") {
    stage = resolved ? "explain" : "nudge";
    try {
      remediation = await remediate(q, topic, tries, stage);
    } catch (e) {
      remediation = stage === "explain" ? q.explanation ?? `The answer is ${q.answer}.` : q.hint ?? "Check your setup and try once more.";
      console.error("remediate failed", e);
    }
  }

  if (resolved) {
    const { data: attempt } = await db()
      .from("chem_attempts")
      .insert({
        profile,
        session_id: sessionId || null,
        question_id: q.id,
        topic_id: q.topic_id,
        answer: tries.join(" | "),
        correct,
        first_try: correct && attemptNo === 1,
        hint_used: !!hintUsed,
        remediation: remediation ?? null,
        subject: q.subject,
      })
      .select("id")
      .single();

    // Spaced repetition update.
    const { data: existing } = await db().from("chem_review_queue").select("box").eq("profile", profile).eq("question_id", q.id).maybeSingle();
    const box = existing?.box ?? (correct ? 1 : 0);
    const nr = nextReview(box, correct);
    if (existing || !correct) {
      await db().from("chem_review_queue").upsert({
        profile,
        question_id: q.id,
        topic_id: q.topic_id,
        subject: q.subject,
        box: nr.box,
        due_at: nr.dueAt.toISOString(),
        lapses: (existing ? 0 : 0) + (correct ? 0 : 1),
        last_result: correct,
        updated_at: new Date().toISOString(),
      });
    }

    if (remediation) {
      await db().from("chem_tutor_log").insert({ profile, attempt_id: attempt?.id ?? null, question_id: q.id, kind: stage ?? "explain", content: remediation, subject: q.subject });
    }

    // On a miss, quietly generate a fresh variant and queue it for the same review slot.
    if (!correct && q.qtype !== "flashcard" && q.qtype !== "sketch") {
      after(async () => {
        try {
          const vs = await generateQuestions(topic, 1, [q], { variantOf: q, difficulty: q.difficulty });
          if (!vs.length) return;
          const { data: ins } = await db()
            .from("chem_questions")
            .insert({ ...vs[0], topic_id: q.topic_id, source: "variant", subject: q.subject })
            .select("id")
            .single();
          if (ins) {
            await db().from("chem_review_queue").upsert({
              profile,
              question_id: ins.id,
              topic_id: q.topic_id,
              subject: q.subject,
              box: 1,
              due_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              lapses: 0,
              last_result: null,
              updated_at: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("variant generation failed", e);
        }
      });
    }
  } else if (remediation) {
    await db().from("chem_tutor_log").insert({ profile, question_id: q.id, kind: "nudge", content: remediation, subject: q.subject });
  }

  return NextResponse.json({
    correct,
    resolved,
    note,
    feedback,
    remediation,
    stage,
    correctAnswer: resolved ? q.answer : undefined,
    answerTex: resolved ? q.meta?.answer_tex ?? undefined : undefined,
    explanation: resolved && (correct || q.qtype === "sketch") ? q.explanation ?? undefined : undefined,
  });
}
