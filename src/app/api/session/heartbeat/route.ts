import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, seconds } = await req.json();
  const add = Math.min(60, Math.max(0, Number(seconds) || 0));
  const { data } = await db().from("chem_sessions").select("active_seconds, profile").eq("id", id).maybeSingle();
  if (!data || data.profile !== s.profile) return NextResponse.json({ ok: false });
  await db()
    .from("chem_sessions")
    .update({ active_seconds: data.active_seconds + add, last_seen_at: new Date().toISOString() })
    .eq("id", id);
  return NextResponse.json({ ok: true });
}
