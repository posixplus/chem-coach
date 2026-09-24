import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQuestion } from "@/lib/questions";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  const q = await getQuestion(id);
  return NextResponse.json({ hint: q?.hint ?? null });
}
