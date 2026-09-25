import { NextResponse } from "next/server";
import { isSubject, SUBJECT_COOKIE } from "@/lib/subject";

/** /subject/math?next=/study switches the current subject and redirects back. */
export async function GET(req: Request, { params }: { params: Promise<{ s: string }> }) {
  const { s } = await params;
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/study";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/study";
  const res = NextResponse.redirect(new URL(safeNext, req.url));
  if (isSubject(s)) {
    res.cookies.set(SUBJECT_COOKIE, s, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: false });
  }
  return res;
}
