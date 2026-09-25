import { db } from "./supabase";
import { localDateKey } from "./time";
import type { Subject } from "./subject";

export type DayStat = { date: string; seconds: number; attempts: number; correct: number };

export async function dailyStats(profile: string, days = 28, subject?: Subject): Promise<DayStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let sq = db().from("chem_sessions").select("started_at, active_seconds").eq("profile", profile).gte("started_at", since);
  let aq = db().from("chem_attempts").select("created_at, correct").eq("profile", profile).gte("created_at", since);
  if (subject) {
    sq = sq.eq("subject", subject);
    aq = aq.eq("subject", subject);
  }
  const [{ data: sessions }, { data: attempts }] = await Promise.all([sq, aq]);
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

export async function totals(profile: string, subject?: Subject) {
  let sq = db().from("chem_sessions").select("active_seconds, started_at").eq("profile", profile);
  let aq = db().from("chem_attempts").select("correct, first_try").eq("profile", profile);
  if (subject) {
    sq = sq.eq("subject", subject);
    aq = aq.eq("subject", subject);
  }
  const [{ data: sessions }, { data: attempts }] = await Promise.all([sq, aq]);
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

export async function recentMisses(profile: string, limit = 15, subject?: Subject) {
  let q = db()
    .from("chem_attempts")
    .select("id, created_at, answer, topic_id, remediation, subject, question:chem_questions(prompt, answer, answer_unit, meta)")
    .eq("profile", profile)
    .eq("correct", false);
  if (subject) q = q.eq("subject", subject);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function recentSessions(profile: string, limit = 10, subject?: Subject) {
  let q = db().from("chem_sessions").select("*").eq("profile", profile);
  if (subject) q = q.eq("subject", subject);
  const { data } = await q.order("started_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function upcomingAgenda(limit = 6, subject?: Subject) {
  const today = localDateKey();
  let q = db().from("chem_agenda").select("*").gte("date", today);
  if (subject) q = q.eq("subject", subject);
  const { data } = await q.order("date").limit(limit);
  return data ?? [];
}
