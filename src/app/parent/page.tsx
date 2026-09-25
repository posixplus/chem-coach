import Link from "next/link";
import MathText from "@/components/MathText";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import { getSession } from "@/lib/auth";
import { listTopics, masteryByTopic } from "@/lib/questions";
import { dailyStats, totals, recentMisses, recentSessions, upcomingAgenda } from "@/lib/stats";
import { fmtDate, fmtDateTime, fmtDuration } from "@/lib/time";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { getSubject, SUBJECTS } from "@/lib/subject";
import { addAgendaItem, deleteAgendaItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function ParentPage() {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/study");
  const profile = "student";
  const subject = await getSubject();
  const info = SUBJECTS[subject];
  const [topics, mastery, days, tot, misses, sessions, agenda, allDays] = await Promise.all([
    listTopics(subject),
    masteryByTopic(profile, subject),
    dailyStats(profile, 28, subject),
    totals(profile, subject),
    recentMisses(profile, 12, subject),
    recentSessions(profile, 8, subject),
    upcomingAgenda(10, subject),
    dailyStats(profile, 7),
  ]);
  const allWeekSecs = allDays.reduce((s, d) => s + d.seconds, 0);
  const { data: tutorLog } = await db().from("chem_tutor_log").select("kind, content, created_at").eq("profile", profile).eq("subject", subject).order("created_at", { ascending: false }).limit(6);
  const week = days.slice(-7);
  const weekSecs = week.reduce((s, d) => s + d.seconds, 0);
  const weekAttempts = week.reduce((s, d) => s + d.attempts, 0);
  const weekCorrect = week.reduce((s, d) => s + d.correct, 0);
  const maxSecs = Math.max(600, ...days.map((d) => d.seconds));
  const tname = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">
            {env.studentName()}&apos;s progress · {info.label}
          </h1>
          <p className="text-sm text-stone-500">All subjects this week: {fmtDuration(allWeekSecs)}. Switch subject at the top.</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Tile label="This week" value={fmtDuration(weekSecs)} sub={`${week.filter((d) => d.seconds > 0).length} active days`} />
          <Tile label="Questions this week" value={String(weekAttempts)} sub={weekAttempts ? `${Math.round((100 * weekCorrect) / weekAttempts)}% correct` : "–"} />
          <Tile label="Streak" value={`${tot.streak} d`} sub="consecutive days" />
          <Tile label="All time" value={fmtDuration(tot.seconds)} sub={`${tot.sessions} sessions`} />
          <Tile label="First-try accuracy" value={tot.attempts ? `${Math.round((100 * tot.firstTry) / tot.attempts)}%` : "–"} sub={`${tot.attempts} answered`} />
        </section>

        <section className="card">
          <h2 className="mb-3 font-medium">Minutes per day (last 28 days, Eastern time)</h2>
          <div className="flex h-32 items-end gap-1">
            {days.map((d) => (
              <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end" title={`${fmtDate(d.date)}: ${fmtDuration(d.seconds)}, ${d.attempts} q`}>
                <div className={`w-full rounded-t ${d.attempts && d.correct / d.attempts >= 0.7 ? "bg-emerald-600" : d.attempts ? "bg-amber-500" : "bg-stone-300"}`} style={{ height: `${Math.max(d.seconds ? 4 : 1, (100 * d.seconds) / maxSecs)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-stone-500">
            <span>{fmtDate(days[0].date)}</span>
            <span>{fmtDate(days[days.length - 1].date)}</span>
          </div>
          <p className="mt-2 text-xs text-stone-500">Green: 70%+ correct that day. Amber: below 70%. Grey: time logged but no questions. Time counts only while the tab is visible and he interacted in the last 2 minutes.</p>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card">
            <h2 className="mb-3 font-medium">Mastery by topic</h2>
            <ul className="space-y-2">
              {topics.map((t) => {
                const m = mastery[t.id];
                const pct = m?.mastery ?? 0;
                return (
                  <li key={t.id}>
                    <div className="flex justify-between text-sm">
                      <span>{t.name}</span>
                      <span className="text-stone-500">{m ? `${pct}% · ${m.attempts} q · ${Math.round(100 * m.firstTryRate)}% first try` : "not started"}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-stone-200">
                      <div className={`h-full ${pct >= 80 ? "bg-emerald-600" : pct >= 50 ? "bg-amber-500" : "bg-stone-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card">
            <h2 className="mb-3 font-medium">Coming up ({info.teacher})</h2>
            {agenda.length ? (
              <ul className="space-y-1 text-sm">
                {agenda.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className="w-24 shrink-0 text-stone-500">{fmtDate(a.date)}</span>
                    <span className={`flex-1 ${a.kind === "test" ? "font-medium text-red-700" : a.kind === "quiz" ? "font-medium text-amber-700" : ""}`}>{a.text}</span>
                    {a.source === "manual" && (
                      <form action={deleteAgendaItem}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-xs text-stone-400 hover:text-red-700" type="submit" title="Remove">remove</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">Nothing upcoming. Add a date below when Schoology announces one.</p>
            )}
            <form action={addAgendaItem} className="mt-3 grid gap-2 rounded-lg border border-dashed border-stone-300 p-3 text-sm sm:grid-cols-[auto_auto_1fr]">
              <input type="hidden" name="subject" value={subject} />
              <input className="input" type="date" name="date" required />
              <select className="input" name="kind" defaultValue="quiz">
                <option value="quiz">Quiz</option>
                <option value="test">Test</option>
                <option value="due">Due</option>
                <option value="other">Other</option>
              </select>
              <input className="input" name="text" placeholder="e.g. Quiz: rational functions" required maxLength={140} />
              <select className="input sm:col-span-2" name="topic_id" defaultValue="">
                <option value="">Drill: whole subject (mixed)</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    Drill: {t.name}
                  </option>
                ))}
              </select>
              <button className="btn-secondary" type="submit">Add {info.label} date</button>
            </form>
            <h2 className="mb-2 mt-5 font-medium">Recent sessions</h2>
            <ul className="space-y-1 text-sm text-stone-600">
              {sessions.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{fmtDateTime(s.started_at)}</span>
                  <span>
                    {s.topic_id ? tname[s.topic_id] ?? s.topic_id : "mixed"} · {fmtDuration(s.active_seconds)}
                  </span>
                </li>
              ))}
              {!sessions.length && <li>No sessions yet.</li>}
            </ul>
          </section>
        </div>

        <section className="card">
          <h2 className="mb-3 font-medium">Recent misses (and what the tutor told him)</h2>
          {misses.length ? (
            <ul className="divide-y divide-stone-100">
              {misses.map((m) => {
                const q = m.question as unknown as { prompt: string; answer: string; answer_unit: string | null; meta: { answer_tex?: string } | null } | null;
                return (
                  <li key={m.id} className="py-3 text-sm">
                    <p className="text-xs text-stone-500">
                      {fmtDateTime(m.created_at)} · {tname[m.topic_id] ?? m.topic_id}
                    </p>
                    <MathText as="p" className="font-medium" text={q?.prompt ?? ""} />
                    <p className="text-stone-600">
                      Answered: <span className="text-red-700">{m.answer}</span> · Correct: <MathText text={q?.meta?.answer_tex ? `$${q.meta.answer_tex}$` : q?.answer ?? ""} /> {q?.answer_unit ?? ""}
                    </p>
                    {m.remediation && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-stone-500">Tutor explanation</summary>
                        <MathText as="p" className="mt-1 whitespace-pre-wrap text-stone-700" text={m.remediation} />
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">No misses yet.</p>
          )}
        </section>

        {tutorLog && tutorLog.length > 0 && (
          <section className="card">
            <h2 className="mb-3 font-medium">Latest tutor conversations</h2>
            <ul className="space-y-3 text-sm">
              {tutorLog.map((t, i) => (
                <li key={i}>
                  <p className="text-xs text-stone-500">
                    {fmtDateTime(t.created_at)} · {t.kind}
                  </p>
                  <MathText as="p" className="whitespace-pre-wrap text-stone-700" text={t.content} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-sm text-stone-500">
          Manage the question bank or generate more questions on the <Link href="/parent/bank" className="underline">question bank</Link> page.
        </p>
      </main>
    </>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-stone-500">{sub}</p>
    </div>
  );
}
