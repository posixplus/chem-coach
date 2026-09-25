import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import BankTools from "@/components/BankTools";
import { getSession } from "@/lib/auth";
import { listTopics } from "@/lib/questions";
import { db } from "@/lib/supabase";
import { toggleQuestion } from "./actions";
import { getSubject } from "@/lib/subject";
import MathText from "@/components/MathText";
import GraphView from "@/components/GraphView";

export const dynamic = "force-dynamic";

export default async function BankPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/study");
  const { topic } = await searchParams;
  const subject = await getSubject();
  const topics = await listTopics(subject);
  const counts: Record<string, number> = {};
  const { data: all } = await db().from("chem_questions").select("topic_id, active").eq("subject", subject);
  for (const q of all ?? []) if (q.active) counts[q.topic_id] = (counts[q.topic_id] ?? 0) + 1;
  const sel = topic && topics.find((t) => t.id === topic) ? topic : topics[0]?.id;
  const { data: qs } = await db().from("chem_questions").select("*").eq("topic_id", sel).order("created_at", { ascending: false }).limit(300);

  return (
    <>
      <TopBar session={session} here="/parent/bank" />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4">
        <h1 className="text-2xl font-semibold">Question bank</h1>
        <BankTools topics={topics.map((t) => ({ id: t.id, name: `Unit ${t.unit}: ${t.name}`, count: counts[t.id] ?? 0 }))} selected={sel} />
        <section className="space-y-2">
          {(qs ?? []).map((q) => (
            <div key={q.id} className={`card text-sm ${q.active ? "" : "opacity-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-stone-500">
                    {q.qtype}
                    {q.meta?.kind ? ` (${q.meta.kind})` : ""} · difficulty {q.difficulty} · {q.source}
                    {q.calc ? ` · ${q.calc}` : ""}
                  </p>
                  <MathText as="p" className="font-medium whitespace-pre-wrap" text={q.prompt} />
                  {q.graph && <GraphView spec={q.graph} size={220} className="w-44" />}
                  {q.choices && !q.meta?.choice_graphs && <MathText as="p" className="text-stone-600" text={"Choices: " + (q.choices as string[]).join(" | ")} />}
                  <p className="text-stone-700">
                    Answer: <MathText className="font-semibold" text={q.meta?.answer_tex ? `$${q.meta.answer_tex}$` : q.answer} /> {q.answer_unit ?? ""}
                    {q.sig_figs ? ` (${q.sig_figs} sf)` : ""}
                  </p>
                  {q.explanation && <MathText as="p" className="text-stone-500" text={q.explanation} />}
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
