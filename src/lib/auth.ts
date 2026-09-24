import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

export type Role = "student" | "parent";
export type Session = { role: Role; name: string; profile: string };

const COOKIE = "chem_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function key() {
  return new TextEncoder().encode(env.authSecret());
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT(s as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.role !== "student" && payload.role !== "parent") return null;
    return { role: payload.role, name: String(payload.name), profile: String(payload.profile) };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(COOKIE)?.value);
}

export async function setSessionCookie(s: Session) {
  const store = await cookies();
  store.set(COOKIE, await signSession(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Resolve a passcode to a session, or null. Constant-time-ish comparison is overkill for 4 digits, but rate limiting matters (see login action). */
export function resolvePasscode(code: string): Session | null {
  const c = code.trim();
  if (c === env.studentPasscode()) return { role: "student", name: env.studentName(), profile: "student" };
  if (c === env.parentPasscode()) return { role: "parent", name: env.parentName(), profile: "parent" };
  return null;
}

export const SESSION_COOKIE = COOKIE;
