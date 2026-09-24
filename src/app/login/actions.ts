"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolvePasscode, setSessionCookie, clearSessionCookie } from "@/lib/auth";

// Simple in-memory rate limit per IP (resets on cold start; good enough for a family app).
const tries = new Map<string, { n: number; until: number }>();

export async function login(formData: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const t = tries.get(ip) ?? { n: 0, until: 0 };
  if (t.until > now) redirect("/login?error=slow");

  const code = String(formData.get("passcode") ?? "");
  const session = resolvePasscode(code);
  if (!session) {
    t.n += 1;
    if (t.n >= 5) {
      t.until = now + 60_000;
      t.n = 0;
    }
    tries.set(ip, t);
    redirect("/login?error=bad");
  }
  tries.delete(ip);
  await setSessionCookie(session);
  redirect(session.role === "parent" ? "/parent" : "/study");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
