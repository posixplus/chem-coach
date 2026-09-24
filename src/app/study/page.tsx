import Link from "next/link";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import { getSession } from "@/lib/auth";
import { listTopics, masteryByTopic } from "@/lib/questions";
import { totals, upcomingAgenda } from "@/lib/stats";
import { fmtDate, fmtDuration, daysUntil } from "@/lib/time";
import { db } from "@/lib/supabase";
import { listSheets } from "@/lib/revise";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = "student"; // the parent's "student view" still shows Sachin's data
  const [topics, mastery, tot, agenda] = await Promise.all([listTopics(), masteryByTopic(profile), totals(profile), upcomingAgenda(8)]);
  const dueTotal = Object.values(mastery).reduce((s, m) => s + m.due, 0);
  const sheets = listSheets();
  const { count: bankCount } = await db().from("chem_questions").select("id", { count: "exact", head: true }).eq("active", true);

  const next = agenda.find((a) => a.kind === "quiz" || a.kind === "test") ?? agenda[0];
  const units = Array.from(new Set(topics.map((t) => t.unit))).sort();

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="card md:col-span-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Study tonight</h2>
            {next ? (
              <>
                <p className="mt-1 text-xl font-semibold">
                  {next.text}
                </p>
                <p className="text-stone-600">
                  {fmtDate(next.date)} · {daysUntil(next.date) === 0 ? "today" : daysUntil(next.date) === 1 ? "tomorrow" : `in ${daysUntil(next.date)} days`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {next.topic_id ? (
                    <Link href={`/quiz/${next.topic_id}`} className="btn-primary">Drill this</Link>
                  ) : (
                    <Link href="/quiz/mixed" className="btn-primary">Quick 10 (mixed)</Link>
                  )}
                  {dueTotal > 0 && <Link href="/quiz/review" className="btn-secondary">Review {dueTotal} missed</Link>}
                </div>
              </>
            ) : (
              <p className="mt-1 text-stone-600">Nothing on the agenda yet. Try a mixed Quick 10.</p>
            )}
            {agenda.length > 1 && (
              <ul className="mt-4 space-y-1 text-sm text-stone-600">
                {agenda.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="w-24 shrink-0 text-stone-500">{fmtDate(a.date)}</span>
                    <span className={a.kind === "test" ? "font-medium text-red-700" : a.kind === "quiz" ? "font-medium text-amber-700" : ""}>{a.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Your stats</h2>
            <Stat label="Streak" value={`${tot.streak} day${tot.streak === 1 ? "" : "s"}`} />
            <Stat label="Time studied" value={fmtDuration(tot.seconds)} />
            <Stat label="Questions answered" value={String(tot.attempts)} />
            <Stat label="First-try accuracy" value={tot.attempts ? `${Math.round((100 * tot.firstTry) / tot.attempts)}%` : "–"} />
            <Stat label="Bank size" value={String(bankCount ?? 0)} />
          </div>
        </section>

        {sheets.length > 0 && (
          <section className="card">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Revision sheets</h2>
              <Link href="/revise" className="text-sm text-emerald-800 underline">All sheets</Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {sheets.map((sh) => (
                <Link key={sh.slug} href={`/revise/${sh.slug}`} className="btn-secondary">
                  Unit {sh.unit}: {sh.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {units.map((u) => (
          <section key={u}>
            <h2 className="mb-2 text-lg font-semibold">
              Unit {u}: {topics.find((t) => t.unit === u)?.unit_name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics
                .filter((t) => t.unit === u)
                .map((t) => {
                  const m = mastery[t.id];
                  const pct = m?.mastery ?? 0;
                  return (
                    <Link key={t.id} href={`/quiz/${t.id}`} className="card block transition hover:border-emerald-500">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium">{t.name}</h3>
                        {m?.due ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{m.due} due</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-stone-500">{t.description}</p>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded bg-stone-200">
                        <div className={`h-full ${pct >= 80 ? "bg-emerald-600" : pct >= 50 ? "bg-amber-500" : "bg-stone-400"}`} style={{ width: `${Math.max(3, pct)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {m ? `${pct}% mastery · ${m.attempts} answered` : "Not started"}
                      </p>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
