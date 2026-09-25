import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { listTopics, pickBatch, getTopic } from "@/lib/questions";
import { getSubject, isSubject, type Subject } from "@/lib/subject";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || "mixed";
  const n = Math.min(25, Math.max(1, Number(url.searchParams.get("n")) || 10));
  const profile = s.profile; // the parent practicing does not pollute the student's record
  // Subject: from the topic itself, else ?subject=, else the cookie.
  let subject: Subject = await getSubject();
  const qs = url.searchParams.get("subject");
  if (isSubject(qs)) subject = qs;
  if (topic !== "mixed" && topic !== "review") {
    const t = await getTopic(topic);
    if (t && isSubject(t.subject)) subject = t.subject;
  }

  let picked;
  if (topic === "review") {
    const { data: due } = await db().from("chem_review_queue").select("question_id").eq("profile", profile).eq("subject", subject).lte("due_at", new Date().toISOString()).order("due_at").limit(n);
    const ids = (due ?? []).map((d) => d.question_id);
    const { data } = ids.length ? await db().from("chem_questions").select("*").in("id", ids).eq("active", true) : { data: [] };
    picked = data ?? [];
  } else {
    picked = await pickBatch(profile, topic, n, subject);
  }
  const { data: due } = await db().from("chem_review_queue").select("question_id").eq("profile", profile).lte("due_at", new Date().toISOString());
  const dueSet = new Set((due ?? []).map((d) => d.question_id));
  const topics = await listTopics(subject);
  const tname = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  return NextResponse.json({
    questions: picked.map((q) => ({
      id: q.id,
      topic_id: q.topic_id,
      topic_name: tname[q.topic_id] ?? q.topic_id,
      qtype: q.qtype,
      prompt: q.prompt,
      choices: q.qtype === "mcq" && q.choices ? (q.meta?.choice_graphs ? [...q.choices] : shuffle([...q.choices])) : null,
      graph: q.graph ?? null,
      calc: q.calc ?? null,
      kind: q.meta?.kind ?? null,
      placeholder: q.meta?.placeholder ?? null,
      choice_graphs: q.meta?.choice_graphs ?? null,
      desmos: q.qtype === "sketch" ? { expressions: q.meta?.desmos ?? [], checklist: q.meta?.checklist ?? [] } : null,
      subject: q.subject,
      answer_unit: q.answer_unit,
      sig_figs: q.sig_figs,
      difficulty: q.difficulty,
      isReview: dueSet.has(q.id),
    })),
  });
}

function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
