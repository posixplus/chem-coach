import { dailyStats, totals, recentMisses, upcomingAgenda } from "./stats";
import { listTopics, masteryByTopic } from "./questions";
import { fmtDate, fmtDuration } from "./time";
import { env } from "./env";
import { SUBJECTS, type Subject } from "./subject";

/** Strip $...$ TeX delimiters so plain-text email stays readable. */
const plain = (s: string) => s.replace(/\$/g, "").replace(/\\(frac|sqrt|left|right|circ|infty|log|cdot)/g, (_m, w) => ({ frac: "", sqrt: "sqrt", left: "", right: "", circ: "∘", infty: "∞", log: "log", cdot: "·" })[w as string] ?? "");

async function subjectSection(profile: string, subject: Subject) {
  const [days, misses, agenda, topics, mastery] = await Promise.all([
    dailyStats(profile, 7, subject),
    recentMisses(profile, 6, subject),
    upcomingAgenda(5, subject),
    listTopics(subject),
    masteryByTopic(profile, subject),
  ]);
  const secs = days.reduce((s, d) => s + d.seconds, 0);
  const attempts = days.reduce((s, d) => s + d.attempts, 0);
  const correct = days.reduce((s, d) => s + d.correct, 0);
  const tname = Object.fromEntries(topics.map((t) => [t.id, t.name]));
  const weak = Object.values(mastery)
    .filter((m) => m.attempts >= 3)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);
  const lines = [
    `== ${SUBJECTS[subject].label} ==`,
    `Time: ${fmtDuration(secs)} · Questions: ${attempts} answered, ${attempts ? Math.round((100 * correct) / attempts) : 0}% correct`,
    `Weakest topics:`,
    ...(weak.length ? weak.map((m) => `  - ${tname[m.topic_id] ?? m.topic_id}: ${m.mastery}% mastery (${m.attempts} answered)`) : ["  - not enough data yet"]),
    `Coming up:`,
    ...(agenda.length ? agenda.map((a) => `  - ${fmtDate(a.date)}: ${a.text}`) : ["  - nothing on the calendar"]),
    `Recent misses:`,
    ...(misses.length
      ? misses.map((m) => {
          const q = m.question as unknown as { prompt: string; answer: string } | null;
          return `  - ${plain(q?.prompt ?? "").slice(0, 110)} (answered: ${m.answer?.slice(0, 40)})`;
        })
      : ["  - none"]),
    ``,
  ];
  return { secs, attempts, lines };
}

/** Build the weekly parent digest as plain text and HTML (one section per subject). */
export async function buildDigest(profile = "student") {
  const [tot, all, ...sections] = await Promise.all([
    totals(profile),
    dailyStats(profile, 7),
    ...(Object.keys(SUBJECTS) as Subject[]).map((s) => subjectSection(profile, s)),
  ]);
  const weekSecs = all.reduce((s, d) => s + d.seconds, 0);
  const weekAttempts = all.reduce((s, d) => s + d.attempts, 0);
  const activeDays = all.filter((d) => d.seconds > 0 || d.attempts > 0).length;

  const lines = [
    `${env.studentName()}'s study week`,
    ``,
    `Time on task: ${fmtDuration(weekSecs)} across ${activeDays} day${activeDays === 1 ? "" : "s"} (streak: ${tot.streak})`,
    `Questions: ${weekAttempts} answered`,
    ``,
    ...sections.flatMap((s) => s.lines),
    env.appUrl() ? `Dashboard: ${env.appUrl()}/parent` : "",
  ];
  const textBody = lines.join("\n");
  const html = `<pre style="font-family: ui-monospace, Menlo, monospace; font-size: 13px; white-space: pre-wrap">${escapeHtml(textBody)}</pre>`;
  return { subject: `Study Coach weekly: ${fmtDuration(weekSecs)}, ${weekAttempts} questions`, text: textBody, html };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
