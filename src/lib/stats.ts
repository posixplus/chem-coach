import { db } from "./supabase";
import { localDateKey } from "./time";

export type DayStat = { date: string; seconds: number; attempts: number; correct: number };

export async function dailyStats(profile: string, days = 28): Promise<DayStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [{ data: sessions }, { data: attempts }] = await Promise.all([
    db().from("chem_sessions").select("started_at, active_seconds").eq("profile", profile).gte("started_at", since),
    db().from("chem_attempts").select("created_at, correct").eq("profile", profile).gte("created_at", since),
  ]);
  const map: Record<string, DayStat> = {};
  for (let i = days - 1; i >= 0; i--) {
    const k = localDateKey(new Date(Date.now() - i * 86400000));
    map[k] = { date: k, seconds: 0, attempts: 0, correct: 0 };
  }
  for (const s of sessions ?? []) {
    const k = localDateKey(new Date(s.started_at));
    if (map[k]) map[k].seconds += s.active_seconds;
  }
  for (const a of attempts ?? []) {
    const k = localDateKey(new Date(a.created_at));
    if (map[k]) {
      map[k].attempts++;
      if (a.correct) map[k].correct++;
    }
  }
  return Object.values(map);
}

export async function totals(profile: string) {
  const { data: sessions } = await db().from("chem_sessions").select("active_seconds, started_at").eq("profile", profile);
  const { data: attempts } = await db().from("chem_attempts").select("correct, first_try").eq("profile", profile);
  const secs = (sessions ?? []).reduce((s, x) => s + x.active_seconds, 0);
  const n = attempts?.length ?? 0;
  const c = (attempts ?? []).filter((a) => a.correct).length;
  const ft = (attempts ?? []).filter((a) => a.correct && a.first_try).length;
  // Streak: consecutive local days with any activity ending today or yesterday.
  const days = new Set((sessions ?? []).map((s) => localDateKey(new Date(s.started_at))));
  let streak = 0;
  let cursor = new Date();
  if (!days.has(localDateKey(cursor))) cursor = new Date(cursor.getTime() - 86400000);
  while (days.has(localDateKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return { seconds: secs, sessions: sessions?.length ?? 0, attempts: n, correct: c, firstTry: ft, streak };
}

export async function recentMisses(profile: string, limit = 15) {
  const { data } = await db()
    .from("chem_attempts")
    .select("id, created_at, answer, topic_id, remediation, question:chem_questions(prompt, answer, answer_unit)")
    .eq("profile", profile)
    .eq("correct", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function recentSessions(profile: string, limit = 10) {
  const { data } = await db().from("chem_sessions").select("*").eq("profile", profile).order("started_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function upcomingAgenda(limit = 6) {
  const today = localDateKey();
  const { data } = await db().from("chem_agenda").select("*").gte("date", today).order("date").limit(limit);
  return data ?? [];
}
