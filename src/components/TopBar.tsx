import Link from "next/link";
import { logout } from "@/app/login/actions";
import type { Session } from "@/lib/auth";
import { getSubject, SUBJECTS, type Subject } from "@/lib/subject";

/** Header with the subject switcher. `here` is where to land after switching (defaults to the study page). */
export default async function TopBar({ session, here }: { session: Session; here?: string }) {
  const subject = await getSubject();
  const back = here ?? (session.role === "parent" ? "/parent" : "/study");
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <Link href={session.role === "parent" ? "/parent" : "/study"} className="whitespace-nowrap font-semibold tracking-tight">
            Study Coach
          </Link>
          <div className="flex rounded-lg border border-stone-300 p-0.5 text-sm" role="tablist" aria-label="Subject">
            {(Object.keys(SUBJECTS) as Subject[]).map((s) => (
              <Link
                key={s}
                href={`/subject/${s}?next=${encodeURIComponent(back)}`}
                prefetch={false}
                role="tab"
                aria-selected={s === subject}
                className={`rounded-md px-2.5 py-1 font-medium ${s === subject ? (s === "math" ? "bg-indigo-700 text-white" : "bg-emerald-700 text-white") : "text-stone-600 hover:bg-stone-100"}`}
              >
                {SUBJECTS[s].label}
              </Link>
            ))}
          </div>
        </div>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-2">
          {session.role === "student" && (
            <>
              <Link href="/study" className="btn-ghost">Study</Link>
              <Link href="/quiz/mixed" className="btn-ghost">Quick 10</Link>
              <Link href="/revise" className="btn-ghost">Revise</Link>
            </>
          )}
          {session.role === "parent" && (
            <>
              <Link href="/parent" className="btn-ghost">Dashboard</Link>
              <Link href="/parent/bank" className="btn-ghost">Bank</Link>
              <Link href="/revise" className="btn-ghost">Revise</Link>
              <Link href="/study" className="btn-ghost">Student view</Link>
            </>
          )}
          <span className="hidden text-stone-500 sm:inline">{session.name}</span>
          <form action={logout}>
            <button className="btn-ghost" type="submit">Log out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
