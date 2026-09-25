import type { Question } from "./supabase";
import { gradeMath } from "./mathgrade";

/** Parse numbers like "3.98e8", "3.98 x 10^8", "3.98×10^8", "1,200", "-273.15 C". */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().toLowerCase();
  s = s.replace(/,/g, "").replace(/\s+/g, " ");
  // scientific notation variants: "a x 10^b", "a × 10^b", "a*10^b", "a e b"
  const sci = s.match(/^(-?\d*\.?\d+)\s*(?:x|×|\*)\s*10\s*\^?\s*\(?(-?\d+)\)?/);
  if (sci) return parseFloat(`${sci[1]}e${parseInt(sci[2], 10)}`);
  const e = s.match(/^(-?\d*\.?\d+)\s*e\s*(-?\d+)/);
  if (e) return parseFloat(`${e[1]}e${parseInt(e[2], 10)}`);
  const plain = s.match(/^(-?\d*\.?\d+)/);
  if (plain) return parseFloat(plain[1]);
  return null;
}

/** Count significant figures in a typed numeric string (best effort). */
export function countSigFigs(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/,/g, "");
  const m = s.match(/^(-?\d*\.?\d+)(?:\s*(?:e|x|×|\*)\s*10?\s*\^?\s*\(?-?\d+\)?)?/);
  if (!m) return null;
  s = m[1].replace("-", "");
  if (s.includes(".")) {
    const digits = s.replace(".", "").replace(/^0+/, "");
    return digits.length || 1;
  }
  const digits = s.replace(/^0+/, "").replace(/0+$/, "");
  return digits.length || 1;
}

export type GradeResult = { correct: boolean; note?: string };

export function gradeLocal(q: Question, raw: string): GradeResult | null {
  const a = raw.trim();
  if (q.qtype === "math") return gradeMath(a, q.answer, q.meta);
  if (q.qtype === "sketch") {
    // Self-checked against the reference graph: the client sends "got-it" or "missed".
    return { correct: a === "got-it" };
  }
  if (q.qtype === "mcq") {
    return { correct: normalize(a) === normalize(q.answer) };
  }
  if (q.qtype === "flashcard") {
    return { correct: normalize(a) === normalize(q.answer) };
  }
  if (q.qtype === "numeric") {
    const got = parseNumber(a);
    const want = parseNumber(q.answer);
    if (got === null || want === null) return { correct: false, note: "I could not read that as a number." };
    const tol = q.tolerance_pct ?? 1;
    let correct: boolean;
    if (want === 0) correct = Math.abs(got) < 1e-9;
    else correct = Math.abs(got - want) / Math.abs(want) <= tol / 100 + 1e-12;
    let note: string | undefined;
    if (correct && q.sig_figs) {
      const sf = countSigFigs(a);
      if (sf !== null && sf !== q.sig_figs) {
        note = `Value is right, but check sig figs: this answer should have ${q.sig_figs}, you gave ${sf}.`;
      }
    }
    return { correct, note };
  }
  return null; // short answers need the tutor
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => "₀₁₂₃₄₅₆₇₈₉".indexOf(c).toString())
    .replace(/[^a-z0-9+\-]/g, "");
}
