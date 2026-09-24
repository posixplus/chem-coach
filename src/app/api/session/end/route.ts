import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ ok: false });
  await db().from("chem_sessions").update({ ended_at: new Date().toISOString() }).eq("id", id).eq("profile", s.profile);
  return NextResponse.json({ ok: true });
}
