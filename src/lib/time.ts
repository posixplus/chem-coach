import { env } from "./env";

/** All display times use America/New_York (EST/EDT, DST handled automatically). */
export function tz() {
  return env.timezone();
}

export function fmtDateTime(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz(),
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

export function fmtDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz(),
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T12:00:00") : new Date(d));
}

/** YYYY-MM-DD of a moment in the app timezone. */
export function localDateKey(d: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz(), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function fmtDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

export function daysUntil(dateKey: string) {
  const today = localDateKey();
  const a = new Date(today + "T00:00:00Z").getTime();
  const b = new Date(dateKey + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}
