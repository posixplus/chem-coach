import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import PrintButton from "@/components/PrintButton";
import { getSession } from "@/lib/auth";
import { getSheet } from "@/lib/revise";
import { fmtDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function SheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { slug } = await params;
  const sheet = getSheet(slug);
  if (!sheet) notFound();
  return (
    <>
      <div className="print:hidden">
        <TopBar session={session} />
      </div>
      <main className="mx-auto w-full max-w-2xl flex-1 p-4 print:max-w-none print:p-0">
        <header className="mb-4 border-b-2 border-stone-900 pb-3">
          <p className="text-xs uppercase tracking-wide text-stone-500">
            Unit {sheet.unit}
            {sheet.test_date ? ` · tested ${fmtDate(sheet.test_date)}` : ""}
          </p>
          <h1 className="text-3xl font-bold leading-tight">{sheet.title}</h1>
          <p className="mt-1 text-sm text-stone-600">{sheet.summary}</p>
          <nav className="mt-3 flex flex-wrap gap-1.5 print:hidden" aria-label="Sections">
            {sheet.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="rounded-full border border-emerald-700 px-2.5 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50">
                {s.text}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex gap-2 print:hidden">
            <PrintButton />
            <Link href={`/subject/${sheet.subject}?next=/quiz/mixed`} prefetch={false} className="btn-secondary">Quiz me on this subject</Link>
          </div>
        </header>
        <article className="revise" dangerouslySetInnerHTML={{ __html: sheet.html }} />
      </main>
    </>
  );
}
