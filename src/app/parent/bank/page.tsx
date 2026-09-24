import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import BankTools from "@/components/BankTools";
import { getSession } from "@/lib/auth";
import { listTopics } from "@/lib/questions";
import { db } from "@/lib/supabase";
import { toggleQuestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function BankPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/study");
  const { topic } = await searchParams;
  const topics = await listTopics();
  const counts: Record<string, number> = {};
  const { data: all } = await db().from("chem_questions").select("topic_id, active");
  for (const q of all ?? []) if (q.active) counts[q.topic_id] = (counts[q.topic_id] ?? 0) + 1;
  const sel = topic && topics.find((t) => t.id === topic) ? topic : topics[0]?.id;
  const { data: qs } = await db().from("chem_questions").select("*").eq("topic_id", sel).order("created_at", { ascending: false }).limit(300);

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4">
        <h1 className="text-2xl font-semibold">Question bank</h1>
        <BankTools topics={topics.map((t) => ({ id: t.id, name: `Unit ${t.unit}: ${t.name}`, count: counts[t.id] ?? 0 }))} selected={sel} />
        <section className="space-y-2">
          {(qs ?? []).map((q) => (
            <div key={q.id} className={`card text-sm ${q.active ? "" : "opacity-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-stone-500">
                    {q.qtype} · difficulty {q.difficulty} · {q.source}
                  </p>
                  <p className="font-medium">{q.prompt}</p>
                  {q.choices && <p className="text-stone-600">Choices: {(q.choices as string[]).join(" | ")}</p>}
                  <p className="text-stone-700">
                    Answer: <span className="font-semibold">{q.answer}</span> {q.answer_unit ?? ""}
                    {q.sig_figs ? ` (${q.sig_figs} sf)` : ""}
                  </p>
                  {q.explanation && <p className="text-stone-500">{q.explanation}</p>}
                </div>
                <form action={toggleQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="active" value={q.active ? "0" : "1"} />
                  <input type="hidden" name="topic" value={sel} />
                  <button className="btn-ghost text-xs" type="submit">{q.active ? "Disable" : "Enable"}</button>
                </form>
              </div>
            </div>
          ))}
          {!qs?.length && <p className="text-stone-500">No questions for this topic yet. Generate some above.</p>}
        </section>
      </main>
    </>
  );
}
