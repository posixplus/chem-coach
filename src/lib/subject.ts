import { cookies } from "next/headers";

export type Subject = "chem" | "math";

export const SUBJECTS: Record<Subject, { label: string; short: string; teacher: string; course: string }> = {
  chem: { label: "Chemistry", short: "Chem", teacher: "Mr. Knapik", course: "MYP Chemistry" },
  math: { label: "IB Math", short: "Math", teacher: "Mrs. Yan", course: "IB Extended Math" },
};

export const SUBJECT_COOKIE = "coach_subject";

export function isSubject(v: unknown): v is Subject {
  return v === "chem" || v === "math";
}

/** Current subject from the cookie (server components and route handlers). Defaults to chemistry. */
export async function getSubject(): Promise<Subject> {
  const store = await cookies();
  const v = store.get(SUBJECT_COOKIE)?.value;
  return isSubject(v) ? v : "chem";
}
