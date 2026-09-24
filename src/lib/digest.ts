import { dailyStats, totals, recentMisses, upcomingAgenda } from "./stats";
import { listTopics, masteryByTopic } from "./questions";
import { fmtDate, fmtDuration } from "./time";
import { env } from "./env";

/** Build the weekly parent digest as plain text and HTML. */
export async function buildDigest(profile = "student") {
  const [days, tot, misses, agenda, topics, mastery] = await Promise.all([
    dailyStats(profile, 7),
    totals(profile),
    recentMisses(profile, 8),
    upcomingAgenda(5),
    listTopics(),
    masteryByTopic(profile),
  ]);
  const weekSecs = days.reduce((s, d) => s + d.seconds, 0);
  const weekAttempts = days.reduce((s, d) => s + d.attempts, 0);
  const weekCorrect = days.reduce((s, d) => s + d.correct, 0);
  const activeDays = days.filter((d) => d.seconds > 0 || d.attempts > 0).length;
  const tname = Object.fromEntries(topics.map((t) => [t.id, t.name]));
  const weak = Object.values(mastery)
    .filter((m) => m.attempts >= 3)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const lines = [
    `${env.studentName()}'s chemistry week`,
    ``,
    `Time on task: ${fmtDuration(weekSecs)} across ${activeDays} day${activeDays === 1 ? "" : "s"} (streak: ${tot.streak})`,
    `Questions: ${weekAttempts} answered, ${weekAttempts ? Math.round((100 * weekCorrect) / weekAttempts) : 0}% correct`,
    ``,
    `Weakest topics:`,
    ...(weak.length ? weak.map((m) => `  - ${tname[m.topic_id] ?? m.topic_id}: ${m.mastery}% mastery (${m.attempts} answered)`) : ["  - not enough data yet"]),
    ``,
    `Coming up:`,
    ...(agenda.length ? agenda.map((a) => `  - ${fmtDate(a.date)}: ${a.text}`) : ["  - nothing on the agenda"]),
    ``,
    `Recent misses:`,
    ...(misses.length
      ? misses.map((m) => {
          const q = m.question as unknown as { prompt: string; answer: string } | null;
          return `  - ${(q?.prompt ?? "").slice(0, 110)} (answered: ${m.answer?.slice(0, 40)})`;
        })
      : ["  - none"]),
    ``,
    env.appUrl() ? `Dashboard: ${env.appUrl()}/parent` : "",
  ];
  const textBody = lines.join("\n");
  const html = `<pre style="font-family: ui-monospace, Menlo, monospace; font-size: 13px; white-space: pre-wrap">${escapeHtml(textBody)}</pre>`;
  return { subject: `Chem Coach weekly: ${fmtDuration(weekSecs)}, ${weekAttempts} questions`, text: textBody, html };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
