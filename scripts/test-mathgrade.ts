import { gradeMath } from "../src/lib/mathgrade";
import type { QuestionMeta } from "../src/lib/supabase";

type Case = [kind: QuestionMeta["kind"], want: string, got: string, expect: boolean, extra?: Partial<QuestionMeta>];
const cases: Case[] = [
  // numbers
  ["number", "571", "571", true],
  ["number", "67/6", "67/6", true],
  ["number", "67/6", "11.17", true],
  ["number", "67/6", "11.1", false],
  ["number", "-1/5", "x = -1/5", true],
  ["number", "-1/5", "-0.2", true],
  ["number", "2/3", "0.667", true],
  ["number", "1/2", "log_5(sqrt(5))", true],
  ["number", "0.8", "4/5", true],
  ["number", "2100", "2.1e3", true],
  ["number", "2100", "2.1 × 10^3", true],
  ["number", "7e2", "7 x 10^2", true, { form: "sci" }],
  ["number", "8e-1", "4/5", false, { form: "sci" }],
  ["number", "8e-1", "8 × 10^-1", true, { form: "sci" }],
  ["number", "2.1e3", "21 x 10^2", false, { form: "sci" }],
  ["number", "2.1e3", "2.1 x 10^3", true, { form: "sci" }],
  ["number", "4.56e-5", "4.56 × 10⁻⁵", true, { form: "sci" }],
  // forms
  ["expr", "(x+3)(x+4)", "(x+4)(x+3)", true, { form: "factored" }],
  ["expr", "(x+3)(x+4)", "x^2+7x+12", false, { form: "factored" }],
  ["expr", "2(x-2)^2", "2(x-2)^2", true, { form: "factored" }],
  ["expr", "3x(x-2)(x+2)", "3x(x^2-4)", false, { form: "factored" }],
  ["expr", "3x(x-2)(x+2)", "3x(x+2)(x-2)", true, { form: "factored" }],
  ["expr", "(x-2)(x^2+2x+4)", "(x-2)(x^2+2x+4)", true, { form: "factored" }],
  ["expr", "(3x-1)(2x+3)", "(2x+3)(3x-1)", true, { form: "factored" }],
  ["expr", "(x+3)^2-4", "(x+3)^2 - 4", true, { form: "vertex" }],
  ["expr", "(x+3)^2-4", "x^2+6x+5", false, { form: "vertex" }],
  ["expr", "2(x+3)^2-11", "2(x+3)²-11", true, { form: "vertex" }],
  // expressions
  ["expr", "2x+8", "8 + 2x", true],
  ["expr", "2x+8", "2(x+4)", true],
  ["expr", "250x^3+75x^2+5x-1", "2(5x)^3+3(5x)^2+5x-1", true],
  ["expr", "250x^3+75x^2+5x-1", "10x^3+15x^2+5x-5", false],
  ["expr", "5x^3+2", "f^-1(x) = 5x³ + 2", true],
  ["expr", "sqrt(x-7)", "√(x-7)", true, { domain: [7, 20] }],
  ["expr", "sqrt(x-7)", "±√(x-7)", false, { domain: [7, 20] }],
  ["expr", "x", "x(1)", true],
  ["expr", "(x-2)/5", "x/5 - 2/5", true],
  // intervals
  ["interval", "[-3, 5)", "[-3,5)", true],
  ["interval", "[-3, 5)", "[-3, 5]", false],
  ["interval", "(-inf, 2]", "[-∞, 2]", false],
  ["interval", "(-inf, 2]", "(-∞, 2]", true],
  ["interval", "(-inf, 2]", "x ≤ 2", false],
  ["interval", "(-inf, inf)", "R", true],
  ["interval", "(-inf, inf)", "all real numbers", true],
  ["interval", "(-inf, 1) U (1, inf)", "(-∞,1)∪(1,∞)", true],
  ["interval", "(-inf, 1) U (1, inf)", "(-inf,inf)", false],
  ["interval", "[-4, 5/2]", "[-4, 2.5]", true],
  // sets
  ["set", "4, -4", "x = ±4", true],
  ["set", "4, -4", "x=4, x=-4", true],
  ["set", "4, -4", "x = 4", false],
  ["set", "", "none", true],
  ["set", "1", "x=1, x=-1", false],
  ["set", "5/3", "x = 5/3", true],
  // points
  ["point", "(0, -2)", "(0,-2)", true],
  ["point", "(0, -2)", "-2", true],
  ["point", "(0, -2/3)", "(0, -0.6666666667)", true],
  ["point", "(-4, 0)", "(0, -4)", false],
  // equations
  ["equation", "y = -2x - 8", "y = -2x - 8", true],
  ["equation", "y = -2x - 8", "y - 0 = -2(x + 4)", true],
  ["equation", "y = -2x - 8", "2x + y = -8", true],
  ["equation", "y = -2x - 8", "y = -2x + 1", false],
  ["equation", "y = x/2", "y = 0.5x", true],
  ["equation", "y = 2", "y = 2", true],
];

let fail = 0;
for (const [kind, want, got, expect, extra] of cases) {
  const r = gradeMath(got, want, { kind, ...(extra ?? {}) });
  const ok = !!r && r.correct === expect;
  if (!ok) {
    fail++;
    console.log(`FAIL ${kind}: want ${want} | got ${got} -> ${JSON.stringify(r)} (expected ${expect})`);
  }
}
console.log(fail ? `${fail} math grading failures` : `math grading tests passed (${cases.length})`);
if (fail) process.exit(1);
