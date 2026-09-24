import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import { db, type Question, type Topic } from "./supabase";

let client: Anthropic | null = null;
function ai() {
  if (!client) client = new Anthropic({ apiKey: env.anthropicKey() });
  return client;
}

const TUTOR_SYSTEM = `You are a patient chemistry tutor for a 10th grade IB MYP student named ${env.studentName()}.
His teacher is Mr. Knapik. Use the teacher's vocabulary exactly (formula unit vs molecule, "brinclhof" diatomics, Pacific-Atlantic sig fig rule, dimensional analysis as "conversion factors that equal 1", density as a conversion factor not a formula, Kelvin as the absolute scale, percent yield vs percent error).
Rules:
- Never lecture for more than about 120 words at a time.
- When the student is wrong, do not just hand over the answer. First point at the specific mistake, ask one guiding question, and let him try again.
- When explaining fully, show the setup with units so he can copy the method, and end with one sentence on how to avoid that mistake next time.
- Plain text only. Use ^ for exponents (10^-3), × for multiplication, subscripts as plain digits (H2O). No markdown headers, no bullet symbols.
- Keep a warm, direct tone. No emojis. Never use em dashes; use commas or periods.
- Facts you must get right: Pacific-Atlantic rule means decimal Present -> start from the Pacific (LEFT) side; decimal Absent -> start from the Atlantic (RIGHT) side. Addition/subtraction rounds to the fewest decimal places; multiplication/division to the fewest significant figures. K = C + 273.15. Percent error = |experimental - accepted| / accepted x 100.`;

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
    TUTOR_SYSTEM,
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
      : "The student missed this twice. Give the full worked solution in at most 150 words, in Mr. Knapik's style, with units in every step. Finish with one sentence: 'Next time, ...' describing how to avoid the mistake.";
  return text(
    TUTOR_SYSTEM,
    `Topic: ${topic.name}\nReference notes:\n${ctx}\n\nQuestion: ${q.prompt}${q.choices ? "\nChoices: " + q.choices.join(" | ") : ""}\nCorrect answer: ${q.answer}${q.answer_unit ? " " + q.answer_unit : ""}\nTeacher hint: ${q.hint ?? "(none)"}\nTeacher explanation: ${q.explanation ?? "(none)"}\n\n${attemptsText}\n\n${instruction}`,
    500,
  );
}

/** Free-form question from the student while studying ("why does the 0 count?"). */
export async function askTutor(question: string, topic: Topic | null, context: string): Promise<string> {
  const ctx = topic ? await notesContext(topic.id, 4000) : "";
  return text(
    TUTOR_SYSTEM,
    `${topic ? "Topic: " + topic.name + "\n" : ""}Reference notes:\n${ctx}\n\nCurrent problem context:\n${context}\n\nStudent asks: ${question}\n\nAnswer in at most 120 words.`,
    500,
  );
}

export type GeneratedQuestion = Omit<Question, "id" | "active" | "source" | "topic_id">;

export async function generateQuestions(
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
    }))
    .filter((q) => q.qtype !== "mcq" || (q.choices && q.choices.includes(q.answer)));
}
