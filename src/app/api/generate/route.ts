import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { getTopic } from "@/lib/questions";
import { generateQuestions } from "@/lib/claude";
import type { Question } from "@/lib/supabase";

/** Parent-only: generate N new bank questions for a topic. */
export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "parent") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { topicId, n, difficulty } = await req.json();
  const topic = await getTopic(topicId);
  if (!topic) return NextResponse.json({ error: "no such topic" }, { status: 404 });
  const { data: existing } = await db().from("chem_questions").select("*").eq("topic_id", topicId).eq("active", true).limit(200);
  const ex = (existing ?? []) as Question[];
  const generated = await generateQuestions(topic, Math.min(15, Math.max(1, Number(n) || 8)), ex.sort(() => Math.random() - 0.5), {
    difficulty: difficulty ? Number(difficulty) : undefined,
    avoidPrompts: ex.map((q) => q.prompt),
  });
  if (!generated.length) return NextResponse.json({ inserted: 0 });
  const { data, error } = await db()
    .from("chem_questions")
    .insert(generated.map((g) => ({ ...g, topic_id: topicId, source: "generated", subject: topic.subject })))
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: data.length });
}
