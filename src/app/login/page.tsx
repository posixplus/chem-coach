import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form action={login} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Study Coach</h1>
          <p className="text-sm text-stone-500">Enter your passcode to start.</p>
        </div>
        <input
          name="passcode"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={12}
          className="input text-center text-2xl tracking-[0.5em]"
          placeholder="••••"
          aria-label="Passcode"
        />
        {error === "bad" && <p className="text-sm text-red-600">That passcode did not work.</p>}
        {error === "slow" && <p className="text-sm text-red-600">Too many tries. Wait a minute and try again.</p>}
        <button className="btn-primary w-full" type="submit">Enter</button>
      </form>
    </main>
  );
}
