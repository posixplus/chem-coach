import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildDigest } from "@/lib/digest";
import { env } from "@/lib/env";

/** Weekly parent digest. Vercel Cron calls this with Authorization: Bearer CRON_SECRET (see vercel.json). */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!env.cronSecret() || auth !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const digest = await buildDigest();
  if (!env.resendKey() || !env.digestTo()) {
    return NextResponse.json({ sent: false, reason: "RESEND_API_KEY or DIGEST_EMAIL_TO not set", preview: digest.text });
  }
  const resend = new Resend(env.resendKey());
  const { error } = await resend.emails.send({
    from: env.digestFrom(),
    to: env.digestTo().split(",").map((s) => s.trim()),
    subject: digest.subject,
    text: digest.text,
    html: digest.html,
  });
  if (error) return NextResponse.json({ sent: false, error: error.message }, { status: 500 });
  return NextResponse.json({ sent: true });
}
