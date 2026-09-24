import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import QuizRunner from "@/components/QuizRunner";
import { getSession } from "@/lib/auth";
import { getTopic } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ topic: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { topic } = await params;
  let title = "Quick 10 (mixed)";
  if (topic === "review") title = "Review missed questions";
  else if (topic !== "mixed") {
    const t = await getTopic(topic);
    if (!t) notFound();
    title = t.name;
  }
  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <QuizRunner topicId={topic} title={title} studentName={session.name} />
      </main>
    </>
  );
}
