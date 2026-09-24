/** Leitner-style spaced repetition. Box 1 = due soon, box 5 = mastered. */
const BOX_INTERVAL_HOURS = [0, 4, 24, 72, 168, 336]; // index = box

export function nextReview(box: number, correct: boolean): { box: number; dueAt: Date } {
  const nb = correct ? Math.min(5, box + 1) : 1;
  const hours = BOX_INTERVAL_HOURS[nb] ?? 24;
  // A miss comes back inside the same study session (about 10 minutes) so the variant is fresh.
  const dueAt = new Date(Date.now() + (correct ? hours * 3600 * 1000 : 10 * 60 * 1000));
  return { box: nb, dueAt };
}
