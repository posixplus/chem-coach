import Link from "next/link";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import { getSession } from "@/lib/auth";
import { listSheets } from "@/lib/revise";
import { fmtDate } from "@/lib/time";
import { getSubject, SUBJECTS } from "@/lib/subject";

export const dynamic = "force-dynamic";

export default async function RevisePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const subject = await getSubject();
  const sheets = listSheets(subject);
  return (
    <>
      <TopBar session={session} here="/revise" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{SUBJECTS[subject].label} revision sheets</h1>
          <p className="text-sm text-stone-500">One page per unit: only the rules, formulas and traps that earn points. They stay here for revising the basics later.</p>
        </div>
        {sheets.length === 0 && <p className="card text-stone-500">No sheets yet. Add a markdown file to content/revise.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {sheets.map((s) => (
            <Link key={s.slug} href={`/revise/${s.slug}`} className="card block transition hover:border-emerald-500">
              <p className="text-xs uppercase tracking-wide text-stone-500">Unit {s.unit}{s.test_date ? ` · tested ${fmtDate(s.test_date)}` : ""}</p>
              <h2 className="mt-1 font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-stone-600">{s.summary}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
