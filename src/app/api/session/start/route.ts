import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { getSubject, isSubject } from "@/lib/subject";
import { getTopic } from "@/lib/questions";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const topicId = body.topicId && !["mixed", "review"].includes(body.topicId) ? String(body.topicId) : null;
  let subject = isSubject(body.subject) ? body.subject : await getSubject();
  if (topicId) {
    const t = await getTopic(topicId);
    if (t && isSubject(t.subject)) subject = t.subject;
  }
  const { data, error } = await db()
    .from("chem_sessions")
    .insert({ profile: s.profile, topic_id: topicId, subject })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
