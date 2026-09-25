import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { getQuestion, getTopic } from "@/lib/questions";
import { askTutor } from "@/lib/claude";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { questionId, question, tries } = await req.json();
  if (!question || String(question).length > 500) return NextResponse.json({ error: "bad question" }, { status: 400 });
  const q = questionId ? await getQuestion(questionId) : null;
  const topic = q ? await getTopic(q.topic_id) : null;
  const context = q ? `Problem: ${q.prompt}\nCorrect answer (do not reveal unless the student already resolved it): ${q.answer}\nStudent's tries so far: ${(tries ?? []).join(" | ") || "none"}` : "";
  const answer = await askTutor(String(question), topic, context);
  await db().from("chem_tutor_log").insert({ profile: s.profile, question_id: q?.id ?? null, kind: "ask", content: `Q: ${question}\nA: ${answer}`, subject: topic?.subject ?? "chem" });
  return NextResponse.json({ answer });
}
