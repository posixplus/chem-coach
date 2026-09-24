import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { listTopics, pickBatch } from "@/lib/questions";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || "mixed";
  const n = Math.min(25, Math.max(1, Number(url.searchParams.get("n")) || 10));
  const profile = s.profile; // the parent practicing does not pollute the student's record

  let picked;
  if (topic === "review") {
    const { data: due } = await db().from("chem_review_queue").select("question_id").eq("profile", profile).lte("due_at", new Date().toISOString()).order("due_at").limit(n);
    const ids = (due ?? []).map((d) => d.question_id);
    const { data } = ids.length ? await db().from("chem_questions").select("*").in("id", ids).eq("active", true) : { data: [] };
    picked = data ?? [];
  } else {
    picked = await pickBatch(profile, topic, n);
  }
  const { data: due } = await db().from("chem_review_queue").select("question_id").eq("profile", profile).lte("due_at", new Date().toISOString());
  const dueSet = new Set((due ?? []).map((d) => d.question_id));
  const topics = await listTopics();
  const tname = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  return NextResponse.json({
    questions: picked.map((q) => ({
      id: q.id,
      topic_id: q.topic_id,
      topic_name: tname[q.topic_id] ?? q.topic_id,
      qtype: q.qtype,
      prompt: q.prompt,
      choices: q.qtype === "mcq" && q.choices ? shuffle([...q.choices]) : null,
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
