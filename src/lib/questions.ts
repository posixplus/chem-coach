import { db, type Question, type Topic } from "./supabase";
import type { Subject } from "./subject";

export async function listTopics(subject?: Subject): Promise<Topic[]> {
  let q = db().from("chem_topics").select("*");
  if (subject) q = q.eq("subject", subject);
  const { data } = await q.order("unit").order("sort");
  return (data ?? []) as Topic[];
}

export async function getTopic(id: string): Promise<Topic | null> {
  const { data } = await db().from("chem_topics").select("*").eq("id", id).maybeSingle();
  return (data as Topic) ?? null;
}

export async function getQuestion(id: string): Promise<Question | null> {
  const { data } = await db().from("chem_questions").select("*").eq("id", id).maybeSingle();
  return (data as Question) ?? null;
}

export type TopicMastery = {
  topic_id: string;
  attempts: number;
  correct: number;
  firstTryRate: number; // 0..1 over recent attempts
  mastery: number; // 0..100 blended score
  due: number; // review items due now
};

/** Mastery per topic: first-try accuracy over the last 20 attempts, blended with SRS boxes. */
export async function masteryByTopic(profile: string, subject?: Subject): Promise<Record<string, TopicMastery>> {
  let aq = db().from("chem_attempts").select("topic_id, correct, first_try, created_at").eq("profile", profile);
  let rq = db().from("chem_review_queue").select("topic_id, box, due_at").eq("profile", profile);
  if (subject) {
    aq = aq.eq("subject", subject);
    rq = rq.eq("subject", subject);
  }
  const [{ data: attempts }, { data: queue }] = await Promise.all([aq.order("created_at", { ascending: false }).limit(2000), rq]);
  const out: Record<string, TopicMastery> = {};
  const recentCount: Record<string, number> = {};
  for (const a of attempts ?? []) {
    const m = (out[a.topic_id] ??= { topic_id: a.topic_id, attempts: 0, correct: 0, firstTryRate: 0, mastery: 0, due: 0 });
    m.attempts++;
    if (a.correct) m.correct++;
    if ((recentCount[a.topic_id] ?? 0) < 20) {
      recentCount[a.topic_id] = (recentCount[a.topic_id] ?? 0) + 1;
      if (a.correct && a.first_try) m.firstTryRate += 1;
    }
  }
  const now = Date.now();
  const boxes: Record<string, number[]> = {};
  for (const r of queue ?? []) {
    (boxes[r.topic_id] ??= []).push(r.box);
    if (new Date(r.due_at).getTime() <= now) {
      const m = (out[r.topic_id] ??= { topic_id: r.topic_id, attempts: 0, correct: 0, firstTryRate: 0, mastery: 0, due: 0 });
      m.due++;
    }
  }
  for (const id of Object.keys(out)) {
    const m = out[id];
    const rc = recentCount[id] ?? 0;
    m.firstTryRate = rc ? m.firstTryRate / rc : 0;
    const bx = boxes[id] ?? [];
    const boxScore = bx.length ? bx.reduce((s, b) => s + b, 0) / (bx.length * 5) : m.firstTryRate;
    // Confidence ramps up with attempt count so 1/1 does not show as 100%.
    const conf = Math.min(1, rc / 10);
    m.mastery = Math.round(100 * conf * (0.7 * m.firstTryRate + 0.3 * boxScore));
  }
  return out;
}

/**
 * Pick a batch: due review items first (fresh variants when available), then bank questions the student
 * has seen least. For "mixed", weight toward weaker topics.
 */
export async function pickBatch(profile: string, topicId: string | "mixed", n: number, subject: Subject): Promise<Question[]> {
  const now = new Date().toISOString();
  let dueQ = db().from("chem_review_queue").select("question_id, topic_id").eq("profile", profile).eq("subject", subject).lte("due_at", now).order("due_at").limit(Math.ceil(n / 2));
  if (topicId !== "mixed") dueQ = dueQ.eq("topic_id", topicId);
  const { data: due } = await dueQ;
  const dueIds = (due ?? []).map((d) => d.question_id);

  // Attempt counts per question for this profile, to prefer unseen questions.
  const { data: seen } = await db().from("chem_attempts").select("question_id, created_at").eq("profile", profile).eq("subject", subject).order("created_at", { ascending: false }).limit(3000);
  const lastSeen: Record<string, number> = {};
  const seenCount: Record<string, number> = {};
  for (const s of seen ?? []) {
    if (!s.question_id) continue;
    seenCount[s.question_id] = (seenCount[s.question_id] ?? 0) + 1;
    lastSeen[s.question_id] ??= new Date(s.created_at).getTime();
  }

  let bankQ = db().from("chem_questions").select("*").eq("active", true).eq("subject", subject);
  if (topicId !== "mixed") bankQ = bankQ.eq("topic_id", topicId);
  const { data: bank } = await bankQ.limit(2000);
  let pool = ((bank ?? []) as Question[]).filter((q) => !dueIds.includes(q.id));

  if (topicId === "mixed") {
    const mastery = await masteryByTopic(profile, subject);
    // Weight: weaker topics (low mastery) get more slots. Unknown topics get medium weight.
    const weight = (q: Question) => {
      const m = mastery[q.topic_id];
      const score = m ? m.mastery : 50;
      return 1.5 - score / 100; // 0.5 .. 1.5
    };
    pool = pool.map((q) => ({ q, w: weight(q) * (1 / (1 + (seenCount[q.id] ?? 0))) * (0.8 + Math.random() * 0.4) }))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.q);
  } else {
    pool.sort((a, b) => {
      const sa = seenCount[a.id] ?? 0, sb = seenCount[b.id] ?? 0;
      if (sa !== sb) return sa - sb;
      const la = lastSeen[a.id] ?? 0, lb = lastSeen[b.id] ?? 0;
      if (la !== lb) return la - lb;
      return Math.random() - 0.5;
    });
  }

  const picked: Question[] = [];
  if (dueIds.length) {
    const { data: dueRows } = await db().from("chem_questions").select("*").in("id", dueIds).eq("active", true);
    picked.push(...((dueRows ?? []) as Question[]));
  }
  for (const q of pool) {
    if (picked.length >= n) break;
    picked.push(q);
  }
  // Light shuffle so reviews are not always first.
  return picked.sort(() => Math.random() - 0.5).slice(0, n);
}
