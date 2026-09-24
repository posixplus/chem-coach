import { gradeLocal, parseNumber, countSigFigs } from "../src/lib/grading";
import type { Question } from "../src/lib/supabase";
const q = (o: Partial<Question>): Question => ({ id: "x", topic_id: "t", qtype: "numeric", prompt: "", choices: null, answer: "0", answer_unit: null, tolerance_pct: 1, sig_figs: null, explanation: null, hint: null, difficulty: 1, source: "bank", active: true, ...o });
const cases: [string, number | null][] = [["3.98e8", 3.98e8], ["3.98 x 10^8", 3.98e8], ["3.98×10^8", 3.98e8], ["3.98 * 10^-4", 3.98e-4], ["1,200", 1200], ["-273.15 C", -273.15], ["abc", null], ["0.40 s", 0.4]];
for (const [inp, want] of cases) { const got = parseNumber(inp); if (got !== want) throw new Error(`parseNumber(${inp}) = ${got}, want ${want}`); }
const sf: [string, number][] = [["0.00130", 3], ["1.3000", 5], ["7400", 2], ["7040", 3], ["3.98e8", 3], ["100.005", 6], ["0.40", 2], ["12", 2]];
for (const [inp, want] of sf) { const got = countSigFigs(inp); if (got !== want) throw new Error(`countSigFigs(${inp}) = ${got}, want ${want}`); }
const r1 = gradeLocal(q({ answer: "0.40", tolerance_pct: 2, sig_figs: 2 }), "0.404");
if (!r1?.correct || !r1.note) throw new Error("expected correct with sig fig note: " + JSON.stringify(r1));
const r2 = gradeLocal(q({ answer: "3.73e17", tolerance_pct: 1, sig_figs: 3 }), "3.73 x 10^17");
if (!r2?.correct || r2.note) throw new Error("expected clean correct: " + JSON.stringify(r2));
const r3 = gradeLocal(q({ answer: "5.0", tolerance_pct: 0, sig_figs: 2 }), "4.953");
if (r3?.correct) throw new Error("4.953 should be wrong when tolerance is 0");
const r4 = gradeLocal(q({ qtype: "mcq", answer: "7.0 × 10³", choices: ["7000", "7.0 × 10³"] }), "7.0 × 10³");
if (!r4?.correct) throw new Error("mcq exact match failed");
const r5 = gradeLocal(q({ qtype: "flashcard", answer: "Na" }), " na ");
if (!r5?.correct) throw new Error("flashcard case-insensitive failed");
const r6 = gradeLocal(q({ answer: "-273", tolerance_pct: 0.2 }), "-273.15");
if (!r6?.correct) throw new Error("negative tolerance failed");
if (gradeLocal(q({ qtype: "short", answer: "x" }), "y") !== null) throw new Error("short should defer to tutor");
console.log("grading tests passed");
