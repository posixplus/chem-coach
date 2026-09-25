import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import { db, type Question, type Topic, type QuestionMeta } from "./supabase";
import { gradeMath } from "./mathgrade";

let client: Anthropic | null = null;
function ai() {
  if (!client) client = new Anthropic({ apiKey: env.anthropicKey() });
  return client;
}

const CHEM_SYSTEM = `You are a patient chemistry tutor for a 10th grade IB MYP student named ${env.studentName()}.
His teacher is Mr. Knapik. Use the teacher's vocabulary exactly (formula unit vs molecule, "brinclhof" diatomics, Pacific-Atlantic sig fig rule, dimensional analysis as "conversion factors that equal 1", density as a conversion factor not a formula, Kelvin as the absolute scale, percent yield vs percent error).
Rules:
- Never lecture for more than about 120 words at a time.
- When the student is wrong, do not just hand over the answer. First point at the specific mistake, ask one guiding question, and let him try again.
- When explaining fully, show the setup with units so he can copy the method, and end with one sentence on how to avoid that mistake next time.
- Plain text only. Use ^ for exponents (10^-3), × for multiplication, subscripts as plain digits (H2O). No markdown headers, no bullet symbols.
- Keep a warm, direct tone. No emojis. Never use em dashes; use commas or periods.
- Facts you must get right: Pacific-Atlantic rule means decimal Present -> start from the Pacific (LEFT) side; decimal Absent -> start from the Atlantic (RIGHT) side. Addition/subtraction rounds to the fewest decimal places; multiplication/division to the fewest significant figures. K = C + 273.15. Percent error = |experimental - accepted| / accepted x 100.`;

const MATH_SYSTEM = `You are a patient math tutor for a 10th grade student named ${env.studentName()} in IB Extended Math (a precalculus course preparing for IB DP Analysis & Approaches or Applications & Interpretation). His teacher is Mrs. Yan. He uses a TI-84.
Rules:
- Never lecture for more than about 120 words at a time.
- When the student is wrong, do not hand over the answer. Point at the specific slip, ask one guiding question, and let him try again.
- When explaining fully, show each algebra step on its own line so he can copy the method, and end with one sentence on how to avoid that mistake next time.
- Write math in LaTeX between single dollar signs, e.g. $f(g(x)) = 2x + 8$ or $\\log_2 8 = 3$. Never use $$ display blocks. No markdown headers, no bullet symbols.
- Keep a warm, direct tone. No emojis. Never use em dashes; use commas or periods.
- Conventions you must follow exactly:
  Interval notation: square bracket = endpoint included (closed dot), parenthesis = excluded (open dot); infinity ALWAYS gets a parenthesis. Use ∪ to join pieces.
  Composition: $(f \\circ g)(x) = f(g(x))$, work from the inside out.
  Inverses: swap x and y, solve for y; verify with $f(g(x)) = x$ AND $g(f(x)) = x$. If the original is not one-to-one (e.g. $x^2$), the inverse needs a domain restriction; $\\sqrt{x^2} = |x|$, not $x$.
  Logs: $\\log_b a = c$ means $b^c = a$. $\\log x$ with no base is base 10.
  Rational functions: factor first. A factor that cancels gives a HOLE, not a vertical asymptote. Horizontal asymptote by degrees: bottom bigger -> $y = 0$; equal -> ratio of leading coefficients; top bigger -> none.
  Polynomial graphs: a crossing zero has odd multiplicity, a touching (bounce) zero has even multiplicity. Complex roots come in conjugate pairs. When counting "real roots" from a graph, count distinct x-intercepts; the number of complex roots is the degree minus the real roots counted with multiplicity.
  Scientific notation: the coefficient must be at least 1 and less than 10 (21 × 10^2 is not finished; it is 2.1 × 10^3).`;

function tutorSystem(subject: string | undefined) {
  return subject === "math" ? MATH_SYSTEM : CHEM_SYSTEM;
}

async function text(system: string, user: string, maxTokens = 700): Promise<string> {
  const res = await ai().messages.create({
    model: env.claudeModel(),
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function extractJson<T>(s: string): T {
  const start = s.indexOf("[") >= 0 && (s.indexOf("{") < 0 || s.indexOf("[") < s.indexOf("{")) ? s.indexOf("[") : s.indexOf("{");
  const endArr = s.lastIndexOf("]");
  const endObj = s.lastIndexOf("}");
  const end = Math.max(endArr, endObj);
  if (start < 0 || end < 0) throw new Error("No JSON in model output");
  return JSON.parse(s.slice(start, end + 1)) as T;
}

/** Pull the most relevant note chunks for a topic (teacher notes first, textbook second). */
export async function notesContext(topicId: string, maxChars = 7000): Promise<string> {
  const { data } = await db()
    .from("chem_notes_chunks")
    .select("source, heading, content")
    .eq("topic_id", topicId)
    .order("source", { ascending: false }) // 'teacher-notes' sorts after 'textbook'
    .limit(12);
  let out = "";
  for (const c of data ?? []) {
    const piece = `[${c.source}${c.heading ? ": " + c.heading : ""}]\n${c.content}\n\n`;
    if (out.length + piece.length > maxChars) break;
    out += piece;
  }
  return out;
}

export type ShortGrade = { correct: boolean; feedback: string };

export async function gradeShortAnswer(q: Question, studentAnswer: string, topic: Topic): Promise<ShortGrade> {
  const ctx = await notesContext(q.topic_id, 3500);
  const out = await text(
    tutorSystem(topic.subject),
    `Topic: ${topic.name}\nReference notes:\n${ctx}\n\nQuestion: ${q.prompt}\nModel answer: ${q.answer}\nStudent answer: ${studentAnswer}\n\nDecide if the student's answer is essentially correct (same key ideas, minor wording differences are fine). Respond with JSON only: {"correct": true|false, "feedback": "one or two sentences"}`,
    300,
  );
  try {
    const j = extractJson<ShortGrade>(out);
    return { correct: !!j.correct, feedback: String(j.feedback ?? "") };
  } catch {
    return { correct: false, feedback: out.slice(0, 300) };
  }
}

export type RemediationStage = "nudge" | "explain";

/**
 * nudge: after the first miss. Identify the likely error, ask one guiding question. No answer.
 * explain: after the second miss. Full worked explanation in the teacher's style.
 */
export async function remediate(
  q: Question,
  topic: Topic,
  attempts: string[],
  stage: RemediationStage,
): Promise<string> {
  const ctx = await notesContext(q.topic_id, 4000);
  const attemptsText = attempts.map((a, i) => `Attempt ${i + 1}: ${a}`).join("\n");
  const instruction =
    stage === "nudge"
      ? "The student just missed this once. In at most 80 words: name the specific slip you think he made (based on his answer), give the hint if useful, and ask ONE guiding question so he can retry. Do NOT reveal the final answer."
      : topic.subject === "math"
        ? "The student missed this twice. Give the full worked solution in at most 150 words, one step per line, with the math in $...$ LaTeX. Finish with one sentence: 'Next time, ...' describing how to avoid the mistake."
        : "The student missed this twice. Give the full worked solution in at most 150 words, in Mr. Knapik's style, with units in every step. Finish with one sentence: 'Next time, ...' describing how to avoid the mistake.";
  return text(
    tutorSystem(topic.subject),
    `Topic: ${topic.name}\nReference notes:\n${ctx}\n\nQuestion: ${q.prompt}${q.choices ? "\nChoices: " + q.choices.join(" | ") : ""}\nCorrect answer: ${q.answer}${q.answer_unit ? " " + q.answer_unit : ""}\nTeacher hint: ${q.hint ?? "(none)"}\nTeacher explanation: ${q.explanation ?? "(none)"}\n\n${attemptsText}\n\n${instruction}`,
    500,
  );
}

/** Free-form question from the student while studying ("why does the 0 count?"). */
export async function askTutor(question: string, topic: Topic | null, context: string): Promise<string> {
  const ctx = topic ? await notesContext(topic.id, 4000) : "";
  return text(
    tutorSystem(topic?.subject),
    `${topic ? "Topic: " + topic.name + "\n" : ""}Reference notes:\n${ctx}\n\nCurrent problem context:\n${context}\n\nStudent asks: ${question}\n\nAnswer in at most 120 words.`,
    500,
  );
}

export type GeneratedQuestion = Omit<Question, "id" | "active" | "source" | "topic_id" | "subject" | "graph">;

export async function generateQuestions(
  topic: Topic,
  n: number,
  examples: Question[],
  opts: { difficulty?: number; avoidPrompts?: string[]; variantOf?: Question } = {},
): Promise<GeneratedQuestion[]> {
  return topic.subject === "math" ? generateMath(topic, n, examples, opts) : generateChem(topic, n, examples, opts);
}

async function generateChem(
  topic: Topic,
  n: number,
  examples: Question[],
  opts: { difficulty?: number; avoidPrompts?: string[]; variantOf?: Question } = {},
): Promise<GeneratedQuestion[]> {
  const ctx = await notesContext(topic.id, 6000);
  const ex = examples
    .slice(0, 6)
    .map((q) => JSON.stringify({ qtype: q.qtype, prompt: q.prompt, choices: q.choices, answer: q.answer, answer_unit: q.answer_unit, tolerance_pct: q.tolerance_pct, sig_figs: q.sig_figs, hint: q.hint, explanation: q.explanation, difficulty: q.difficulty }))
    .join("\n");
  const variant = opts.variantOf
    ? `\nThese must be FRESH VARIANTS of this missed question: same skill and same method, different numbers or different substance/scenario, so the student cannot just recall the old answer:\n${JSON.stringify({ prompt: opts.variantOf.prompt, answer: opts.variantOf.answer })}\n`
    : "";
  const out = await text(
    `You write practice questions for a 10th grade IB MYP chemistry class. You follow the teacher's notes closely and use his vocabulary. Every numeric answer must be computed carefully and double-checked; show the check in the explanation. Output JSON only.`,
    `Topic: ${topic.name}\nTopic description: ${topic.description}\nReference notes (authoritative):\n${ctx}\n\nStyle examples from the existing bank:\n${ex}\n${variant}
Write ${n} new questions${opts.difficulty ? ` at difficulty ${opts.difficulty} (1 easy to 4 hard)` : " with a mix of difficulties 1 to 4"}. Mix qtypes: "mcq" (4 choices, exactly one correct, answer must match a choice verbatim), "numeric" (answer is a plain number string like "0.0454" or "3.98e8"; include answer_unit, tolerance_pct (1 to 3), sig_figs), and "short" (conceptual, 1 to 3 sentence model answer). Each must include a "hint" (nudge without revealing) and an "explanation" (worked solution with units, under 80 words).
${opts.avoidPrompts?.length ? "Do not repeat these prompts:\n" + opts.avoidPrompts.slice(0, 30).join("\n") + "\n" : ""}
Return a JSON array of objects with keys: qtype, prompt, choices (array or null), answer, answer_unit (or null), tolerance_pct (or null), sig_figs (or null), hint, explanation, difficulty.`,
    4000,
  );
  const arr = extractJson<GeneratedQuestion[]>(out);
  return arr
    .filter((q) => q && q.prompt && q.answer && ["mcq", "numeric", "short"].includes(q.qtype))
    .map((q) => ({
      qtype: q.qtype,
      prompt: String(q.prompt),
      choices: q.qtype === "mcq" && Array.isArray(q.choices) ? q.choices.map(String) : null,
      answer: String(q.answer),
      answer_unit: q.answer_unit ? String(q.answer_unit) : null,
      tolerance_pct: q.qtype === "numeric" ? Number(q.tolerance_pct ?? 2) : null,
      sig_figs: q.sig_figs ? Number(q.sig_figs) : null,
      hint: q.hint ? String(q.hint) : null,
      explanation: q.explanation ? String(q.explanation) : null,
      difficulty: Math.min(4, Math.max(1, Number(q.difficulty ?? 2))),
      meta: null,
      calc: null,
    }))
    .filter((q) => q.qtype !== "mcq" || (q.choices && q.choices.includes(q.answer)));
}

const MATH_KINDS = ["number", "expr", "interval", "set", "point", "equation"] as const;

async function generateMath(
  topic: Topic,
  n: number,
  examples: Question[],
  opts: { difficulty?: number; avoidPrompts?: string[]; variantOf?: Question } = {},
): Promise<GeneratedQuestion[]> {
  const ctx = await notesContext(topic.id, 6000);
  const ex = examples
    .filter((q) => q.qtype === "math" || q.qtype === "mcq")
    .slice(0, 6)
    .map((q) => JSON.stringify({ qtype: q.qtype, prompt: q.prompt, choices: q.choices, answer: q.answer, meta: q.meta ? { kind: q.meta.kind, answer_tex: q.meta.answer_tex, domain: q.meta.domain } : null, calc: q.calc, hint: q.hint, explanation: q.explanation, difficulty: q.difficulty }))
    .join("\n");
  const variant = opts.variantOf
    ? `\nThese must be FRESH VARIANTS of this missed question: same skill and method, different numbers or functions, so the student cannot recall the old answer. Do not rely on a graph picture; state everything in words and LaTeX:\n${JSON.stringify({ prompt: opts.variantOf.prompt, answer: opts.variantOf.answer, meta: opts.variantOf.meta })}\n`
    : "";
  const out = await text(
    `You write practice questions for a 10th grade IB Extended Math (precalculus) class taught by Mrs. Yan. Follow the teacher's notes and conventions. Compute every answer twice by different methods before writing it. Output JSON only.`,
    `Topic: ${topic.name}\nTopic description: ${topic.description}\nReference notes (authoritative):\n${ctx}\n\nStyle examples from the existing bank:\n${ex}\n${variant}
Write ${n} new questions${opts.difficulty ? ` at difficulty ${opts.difficulty} (1 easy to 4 hard)` : " with a mix of difficulties 1 to 4"}. Write math in the prompt with LaTeX between single dollar signs.
Use qtype "math" for anything with a single checkable answer, with meta.kind one of:
  "number"   answer like "-2/3" or "571" (exact, mathjs syntax: sqrt(), ^, log(x, b))
  "expr"     answer is an expression in x like "2x+8"; add meta.domain [a, b] if it only makes sense there (e.g. square roots)
  "interval" answer like "(-inf, 5]" or "(-inf, 1) U (1, inf)"
  "set"      comma separated values like "4, -4", or "" for none (asymptotes, roots, holes)
  "point"    answer like "(0, -2)"
  "equation" answer like "y = -2x - 8"
Also give meta.answer_tex (the answer in LaTeX). Use qtype "mcq" (4 choices, exactly one correct, answer must equal a choice verbatim) for concept checks, and at most one "short" (1 to 3 sentence model answer).
Set calc to "no-calc" or "calc". Each question needs a "hint" (nudge, no answer) and an "explanation" (worked steps with $...$ math, under 80 words).
${opts.avoidPrompts?.length ? "Do not repeat these prompts:\n" + opts.avoidPrompts.slice(0, 30).join("\n") + "\n" : ""}
Return a JSON array of objects with keys: qtype, prompt, choices (array or null), answer, meta ({kind, answer_tex, domain?} or null), calc, hint, explanation, difficulty.`,
    5000,
  );
  const arr = extractJson<(GeneratedQuestion & { meta: QuestionMeta | null })[]>(out);
  return arr
    .filter((q) => q && q.prompt && q.answer !== undefined && ["mcq", "math", "short"].includes(q.qtype))
    .map((q) => ({
      qtype: q.qtype,
      prompt: String(q.prompt),
      choices: q.qtype === "mcq" && Array.isArray(q.choices) ? q.choices.map(String) : null,
      answer: String(q.answer),
      answer_unit: null,
      tolerance_pct: null,
      sig_figs: null,
      hint: q.hint ? String(q.hint) : null,
      explanation: q.explanation ? String(q.explanation) : null,
      difficulty: Math.min(4, Math.max(1, Number(q.difficulty ?? 2))),
      meta:
        q.qtype === "math" && q.meta && (MATH_KINDS as readonly string[]).includes(String(q.meta.kind))
          ? { kind: q.meta.kind, answer_tex: q.meta.answer_tex ? String(q.meta.answer_tex) : undefined, domain: Array.isArray(q.meta.domain) ? (q.meta.domain.map(Number) as [number, number]) : undefined }
          : q.qtype === "short"
            ? { kind: "text" as const }
            : null,
      calc: q.calc === "calc" || q.calc === "no-calc" ? q.calc : null,
    }))
    .filter((q) => q.qtype !== "mcq" || (q.choices && q.choices.includes(q.answer)))
    .filter((q) => q.qtype !== "math" || (q.meta && gradeMath(q.answer, q.answer, q.meta)?.correct === true))
    .map((q) => (q.qtype === "short" ? { ...q, qtype: "math" as const } : q));
}
