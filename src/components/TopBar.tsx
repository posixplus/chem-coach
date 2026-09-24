import Link from "next/link";
import { logout } from "@/app/login/actions";
import type { Session } from "@/lib/auth";

export default function TopBar({ session }: { session: Session }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <Link href={session.role === "parent" ? "/parent" : "/study"} className="whitespace-nowrap font-semibold tracking-tight">
          Chem Coach
        </Link>
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
              <Link href="/parent/bank" className="btn-ghost">Question bank</Link>
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
