/**
 * Deterministic grading for math answers. No LLM involved: equivalent answers are recognised by
 * evaluating expressions at sample points, parsing interval notation, sets and points.
 *
 * Kinds:
 *   number    "-2/3", "0.25", "sqrt(5)/5", "log(100)"    exact value; a close decimal is accepted with a note
 *   expr      "2x+8", "250x^3+75x^2+5x-1"                 same function of x on the sample domain
 *   interval  "(-inf, 5]", "[-3,2) U (2, inf)", "R"        interval notation (strict: infinity gets a parenthesis)
 *   set       "x = 4, x = -4", "±4", "none"               unordered list of values (asymptotes, roots, holes)
 *   point     "(0, -2)"                                     a coordinate pair; a bare y-value is accepted for y-intercepts
 *   equation  "y = -2x - 8", "y - 0 = -2(x + 4)"          same line / curve y = f(x), any rearrangement
 *   text      free response, graded by the tutor
 */
import { create, all, type MathJsInstance, type MathNode } from "mathjs";
import type { AnswerKind, QuestionMeta } from "./supabase";

const math: MathJsInstance = create(all, { number: "number" });

export type MathGrade = { correct: boolean; note?: string };

// ---------- input clean-up ----------

const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };

/** Turn what a student types (or the on-screen keys produce) into mathjs syntax. */
export function normalizeMath(raw: string): string {
  let s = raw.trim();
  s = s.replace(/[−–—]/g, "-").replace(/[×·∙]/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/∞/g, "inf");
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => "^(" + [...m].map((c) => SUP[c]).join("") + ")");
  s = s.replace(/∛\s*\(/g, "cbrt(").replace(/√\s*\(/g, "sqrt(");
  s = s.replace(/∛\s*([a-z0-9.]+)/gi, "cbrt($1)").replace(/√\s*([a-z0-9.]+)/gi, "sqrt($1)");
  // log_b(x) and log_b x  -> log(x, b); log(x) is base 10, ln(x) natural.
  s = s.replace(/log_\{?(\d+(?:\.\d+)?)\}?\s*\(/gi, "LOGB$1(");
  s = s.replace(/log_\{?(\d+(?:\.\d+)?)\}?\s*([a-z0-9.]+)/gi, "LOGB$1($2)");
  s = s.replace(/\bln\s*\(/g, "LN(").replace(/\blog\s*\(/g, "log10(").replace(/\bLN\(/g, "log(");
  s = s.replace(/LOGB(\d+(?:\.\d+)?)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, "log($2, $1)");
  s = s.replace(/\*\*/g, "^");
  // Implicit multiplication that mathjs would read as a function call: x(…), )(…, 2(… is fine already.
  s = s.replace(/(^|[^a-z])x\s*\(/gi, "$1x*(").replace(/\)\s*\(/g, ")*(");
  return s;
}

function evalNum(expr: string, scope: Record<string, number> = {}): number | null {
  try {
    const v = math.evaluate(normalizeMath(expr), { ...scope });
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v && typeof v === "object" && "re" in v && "im" in v) {
      const c = v as { re: number; im: number };
      return Math.abs(c.im) < 1e-12 && Number.isFinite(c.re) ? c.re : null;
    }
    return null;
  } catch {
    return null;
  }
}

function close(a: number, b: number, rel = 1e-9) {
  return Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Strip a leading "f(x) =", "y =", "f^-1(x) =", "x =" etc. */
function stripLhs(s: string): string {
  const m = s.match(/^\s*(?:[a-z](?:\^\s*\(?-1\)?|⁻¹|\^\{-1\})?\s*\(\s*x\s*\)|[a-z]|\[[^\]]*\]\s*\(\s*x\s*\))\s*=\s*(.+)$/i);
  return m ? m[1] : s;
}

// ---------- answer forms ----------

function countX(node: MathNode): number {
  let n = 0;
  node.traverse((c) => {
    if (c.type === "SymbolNode" && (c as unknown as { name: string }).name === "x") n++;
  });
  return n;
}

function unwrap(node: MathNode): MathNode {
  let n = node;
  for (;;) {
    if (n.type === "ParenthesisNode") n = (n as unknown as { content: MathNode }).content;
    else if (n.type === "OperatorNode" && (n as unknown as { fn: string }).fn === "unaryMinus") n = (n as unknown as { args: MathNode[] }).args[0];
    else return n;
  }
}

/** Factored: a product with at least two factors containing x, or a power of a factor containing x. */
export function isFactored(expr: string): boolean {
  try {
    const node = unwrap(math.parse(normalizeMath(stripLhs(expr))));
    const factors: MathNode[] = [];
    const flatten = (n: MathNode) => {
      const u = unwrap(n);
      if (u.type === "OperatorNode" && (u as unknown as { op: string }).op === "*") (u as unknown as { args: MathNode[] }).args.forEach(flatten);
      else factors.push(u);
    };
    flatten(node);
    const withX = factors.filter((f) => countX(f) > 0);
    const isPow = (f: MathNode) => f.type === "OperatorNode" && (f as unknown as { op: string }).op === "^";
    if (!(withX.length >= 2 || (withX.length === 1 && isPow(withX[0])))) return false;
    // Fully factored: no factor of degree 2+ may still have a rational root.
    return withX.every((f) => !hasRationalRoot(isPow(f) ? unwrap((f as unknown as { args: MathNode[] }).args[0]) : f));
  } catch {
    return false;
  }
}

function hasRationalRoot(node: MathNode): boolean {
  let coeffs: number[];
  try {
    const r = math.rationalize(node.toString(), {}, true) as unknown as { coefficients: number[] };
    coeffs = r.coefficients ?? [];
  } catch {
    return false;
  }
  if (coeffs.length < 3) return false; // constant or linear
  const f = (x: number) => coeffs.reduce((s, c, i) => s + c * x ** i, 0);
  for (let q = 1; q <= 12; q++) for (let p = -24; p <= 24; p++) if (Math.abs(f(p / q)) < 1e-9) return true;
  return false;
}

/** Vertex form a(x - h)^2 + k: x appears exactly once, inside a square. */
export function isVertexForm(expr: string): boolean {
  try {
    const node = math.parse(normalizeMath(stripLhs(expr)));
    if (countX(node) !== 1) return false;
    let squared = false;
    node.traverse((c) => {
      if (c.type === "OperatorNode" && (c as unknown as { op: string }).op === "^" && countX(c) === 1) squared = true;
    });
    return squared;
  } catch {
    return false;
  }
}

/** Scientific notation: a × 10^n with 1 ≤ |a| < 10 (or aEn). */
export function isSciNotation(raw: string): boolean {
  const s = raw.trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
  const m = s.match(/^(-?\d+(?:\.\d+)?)(?:[x×*·]10\^\(?(-?\d+)\)?|[x×*·]10([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)|e(-?\d+))$/i);
  if (!m) return false;
  const a = Math.abs(parseFloat(m[1]));
  return a >= 1 && a < 10;
}

function checkForm(ans: string, form: QuestionMeta["form"]): string | null {
  if (form === "factored" && !isFactored(ans)) return "That is equal to the answer, but it is not factored. Write it as a product of factors.";
  if (form === "vertex" && !isVertexForm(ans)) return "That is equal, but not in vertex form. Write it as a(x - h)^2 + k.";
  if (form === "sci" && !isSciNotation(ans)) return "Right value, but not in scientific notation: the number in front must be at least 1 and less than 10, like 2.1 × 10^3.";
  return null;
}

// ---------- kinds ----------

function gradeNumber(ans: string, want: string): MathGrade {
  const w = evalNum(stripLhs(want));
  // "7 x 10^2": x used as a times sign in scientific notation.
  const raw = stripLhs(ans).replace(/(\d)\s*[xX]\s*(?=10)/g, "$1*");
  const g = evalNum(raw);
  if (w === null) return { correct: false, note: "Answer key could not be read." };
  if (g === null) return { correct: false, note: "I could not read that as a number. Try something like -2/3 or 0.25." };
  if (close(g, w)) return { correct: true };
  // Decimal approximations: accept 3 sig figs (IB standard) but nudge toward the exact form.
  if (/\d\.\d/.test(raw) && Math.abs(g - w) <= 0.005 * Math.max(Math.abs(w), 1e-9) + 1e-12) {
    return { correct: true, note: `Accepted. The exact value is ${want}; give exact answers unless the question asks for a decimal.` };
  }
  return { correct: false };
}

const SAMPLE_X = [-7.3, -4.6, -3.1, -2.2, -1.37, -0.61, -0.18, 0.23, 0.77, 1.41, 2.3, 3.2, 4.7, 6.1, 8.9];

function samplePoints(domain?: [number, number]) {
  if (!domain) return SAMPLE_X;
  const [a, b] = domain;
  return Array.from({ length: 13 }, (_, i) => a + ((b - a) * (i + 0.5)) / 13);
}

function sameFunction(a: string, b: string, domain?: [number, number]): boolean | null {
  let agree = 0;
  for (const x of samplePoints(domain)) {
    const va = evalNum(a, { x });
    const vb = evalNum(b, { x });
    if (va === null && vb === null) continue;
    if (va === null || vb === null) return false; // different domains
    if (!close(va, vb, 1e-7)) return false;
    agree++;
  }
  return agree >= 4 ? true : null;
}

function gradeExpr(ans: string, want: string, domain?: [number, number]): MathGrade {
  const a = stripLhs(ans);
  const w = stripLhs(want);
  if (/[a-wyz]/i.test(a.replace(/sqrt|cbrt|log|ln|pi|inf|abs|e\b/gi, ""))) {
    return { correct: false, note: "Use x as the variable." };
  }
  if (/±|\+-|\+\/-/.test(a)) return { correct: false, note: "A function gives one output per input, so ± cannot be part of f(x). Restrict the domain and pick one branch." };
  const r = sameFunction(a, w, domain);
  if (r === null) return { correct: false, note: "I could not evaluate that expression. Check brackets and use ^ for powers." };
  return { correct: r };
}

// Intervals ------------------------------------------------------------------

type Iv = { lo: number; hi: number; loC: boolean; hiC: boolean };

function parseEndpoint(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (/^\+?(inf|infinity|oo)$/.test(t)) return Infinity;
  if (/^-(inf|infinity|oo)$/.test(t)) return -Infinity;
  return evalNum(t);
}

type ParsedIntervals = { ok: true; ivs: Iv[]; note?: string } | { ok: false; note: string };

export function parseIntervals(raw: string): ParsedIntervals {
  let s = normalizeMath(raw).replace(/\s+/g, "");
  s = s.replace(/^(domain|range|d|r)[:=]/i, "");
  if (/^(r|ℝ|reals|allreals|allrealnumbers|\(-inf,inf\))$/i.test(s)) return { ok: true, ivs: [{ lo: -Infinity, hi: Infinity, loC: false, hiC: false }] };
  if (/^(none|empty|∅|\{\})$/i.test(s)) return { ok: true, ivs: [] };
  if (/[<>≤≥]/.test(s)) return { ok: false, note: "Write it in interval notation, like [-3, 5) or (-∞, 2]." };
  if (/[{|}]/.test(s)) return { ok: false, note: "Use interval notation rather than set-builder notation." };
  const parts = s.split(/∪|U(?![a-z])|u(?=[[(])|or/);
  const ivs: Iv[] = [];
  let note: string | undefined;
  for (const p of parts) {
    const m = p.match(/^([[(])(.+),(.+)([\])])$/);
    if (!m) return { ok: false, note: "I could not read that interval. Format: [a, b), with ∪ between pieces." };
    const lo = parseEndpoint(m[2]);
    const hi = parseEndpoint(m[3]);
    if (lo === null || hi === null) return { ok: false, note: "I could not read one of the endpoints." };
    let loC = m[1] === "[";
    let hiC = m[4] === "]";
    if ((loC && !Number.isFinite(lo)) || (hiC && !Number.isFinite(hi))) {
      note = "Infinity always gets a parenthesis, never a square bracket: (-∞, 2], not [-∞, 2].";
      if (!Number.isFinite(lo)) loC = false;
      if (!Number.isFinite(hi)) hiC = false;
    }
    if (lo > hi) return { ok: false, note: "The smaller endpoint goes first." };
    ivs.push({ lo, hi, loC, hiC });
  }
  return { ok: true, ivs: mergeIntervals(ivs), note };
}

function mergeIntervals(ivs: Iv[]): Iv[] {
  const a = [...ivs].sort((p, q) => p.lo - q.lo || (p.loC === q.loC ? 0 : p.loC ? -1 : 1));
  const out: Iv[] = [];
  for (const iv of a) {
    const last = out[out.length - 1];
    if (last && (iv.lo < last.hi || (close(iv.lo, last.hi) && (iv.loC || last.hiC)))) {
      if (iv.hi > last.hi || (close(iv.hi, last.hi) && iv.hiC)) {
        last.hi = iv.hi;
        last.hiC = iv.hiC || (close(iv.hi, last.hi) && last.hiC);
      }
    } else out.push({ ...iv });
  }
  return out;
}

function sameIntervals(a: Iv[], b: Iv[]) {
  if (a.length !== b.length) return false;
  return a.every((x, i) => {
    const y = b[i];
    const eq = (p: number, q: number) => (p === q) || (Number.isFinite(p) && Number.isFinite(q) && close(p, q));
    return eq(x.lo, y.lo) && eq(x.hi, y.hi) && x.loC === y.loC && x.hiC === y.hiC;
  });
}

function gradeInterval(ans: string, want: string): MathGrade {
  const w = parseIntervals(want);
  if (!w.ok) return { correct: false, note: "Answer key could not be read." };
  const g = parseIntervals(ans);
  if (!g.ok) return { correct: false, note: g.note };
  if (!sameIntervals(g.ivs, w.ivs)) {
    // Right numbers, wrong brackets? Say so.
    const loose = (ivs: Iv[]) => ivs.map((i) => ({ ...i, loC: false, hiC: false }));
    if (sameIntervals(loose(g.ivs), loose(w.ivs))) return { correct: false, note: "Right endpoints, but check the brackets: [ ] includes the endpoint (closed dot), ( ) excludes it (open dot)." };
    return { correct: false, note: g.note };
  }
  if (g.note) return { correct: false, note: g.note };
  return { correct: true };
}

// Sets -----------------------------------------------------------------------

function parseSet(raw: string): number[] | null {
  let s = normalizeMath(raw).toLowerCase();
  if (/^\s*(none|no\b.*|dne|n\/a|∅|\{\s*\}|empty)\s*$/.test(s)) return [];
  s = s.replace(/[{}]/g, "").replace(/\b(and|or)\b/g, ",").replace(/;/g, ",");
  const out: number[] = [];
  for (let part of s.split(",")) {
    part = part.trim().replace(/^[a-z]\s*=\s*/, "");
    if (!part) continue;
    const pm = part.match(/^(.*?)(±|\+-|\+\/-)(.+)$/);
    if (pm) {
      const base = pm[1].trim() ? evalNum(pm[1]) : 0;
      const d = evalNum(pm[3]);
      if (base === null || d === null) return null;
      out.push(base + d, base - d);
      continue;
    }
    const v = evalNum(part);
    if (v === null) return null;
    out.push(v);
  }
  return out;
}

function gradeSet(ans: string, want: string): MathGrade {
  const w = parseSet(want);
  const g = parseSet(ans);
  if (w === null) return { correct: false, note: "Answer key could not be read." };
  if (g === null) return { correct: false, note: "I could not read that. List values separated by commas, like x = 4, x = -4, or type none." };
  const uniq = (a: number[]) => a.filter((v, i) => a.findIndex((u) => close(u, v, 1e-7)) === i).sort((p, q) => p - q);
  const W = uniq(w), G = uniq(g);
  if (W.length === G.length && W.every((v, i) => close(v, G[i], 1e-7))) return { correct: true };
  const missing = W.filter((v) => !G.some((u) => close(u, v, 1e-7))).length;
  const extra = G.filter((v) => !W.some((u) => close(u, v, 1e-7))).length;
  if (W.length === 0) return { correct: false, note: "There are none here." };
  if (missing && !extra) return { correct: false, note: `Partly right: you are missing ${missing === 1 ? "one value" : missing + " values"}.` };
  if (extra && !missing) return { correct: false, note: "Partly right, but you listed an extra value. Check for factors that cancel (those are holes, not asymptotes)." };
  return { correct: false };
}

// Points ---------------------------------------------------------------------

function parsePoint(raw: string): [number, number] | number | null {
  const s = normalizeMath(raw).replace(/\s+/g, "").replace(/^[a-z-]*[:=]/i, "");
  const m = s.match(/^\((.+),(.+)\)$/);
  if (m) {
    const x = evalNum(m[1]), y = evalNum(m[2]);
    return x === null || y === null ? null : [x, y];
  }
  const v = evalNum(s);
  return v;
}

function gradePoint(ans: string, want: string): MathGrade {
  const w = parsePoint(want);
  const g = parsePoint(ans);
  if (!Array.isArray(w)) return { correct: false, note: "Answer key could not be read." };
  if (g === null) return { correct: false, note: "Write a point like (0, -2)." };
  if (typeof g === "number") {
    if (close(w[0], 0) && close(g, w[1], 1e-7)) return { correct: true, note: `Right value. Write intercepts as points: (0, ${ans.trim()}).` };
    return { correct: false, note: "Write a point like (0, -2)." };
  }
  if (close(g[0], w[0], 1e-7) && close(g[1], w[1], 1e-7)) return { correct: true };
  if (close(g[0], w[1], 1e-7) && close(g[1], w[0], 1e-7)) return { correct: false, note: "Coordinates are swapped: points are (x, y)." };
  return { correct: false };
}

// Equations ------------------------------------------------------------------

function gradeEquation(ans: string, want: string, domain?: [number, number]): MathGrade {
  const n = normalizeMath(ans);
  const sides = n.split("=");
  const wantRhs = stripLhs(want); // want is "y = f(x)"
  if (sides.length !== 2) {
    // "-2x - 8" on its own: treat as y = ...
    const r = sameFunction(n, wantRhs, domain);
    return r ? { correct: true, note: "Write it as an equation: y = ..." } : { correct: false, note: "Write the equation, like y = 3x - 2." };
  }
  const [L, R] = sides;
  // The student's equation must hold for every point on y = f(x) and fail for points off it.
  let on = 0;
  for (const x of samplePoints(domain)) {
    const y = evalNum(wantRhs, { x });
    if (y === null) continue;
    const l = evalNum(L, { x, y }), r = evalNum(R, { x, y });
    if (l === null || r === null) return { correct: false, note: "I could not evaluate that equation." };
    if (!close(l, r, 1e-7)) return { correct: false };
    const l2 = evalNum(L, { x, y: y + 1.7 }), r2 = evalNum(R, { x, y: y + 1.7 });
    if (l2 !== null && r2 !== null && close(l2, r2, 1e-7)) return { correct: false };
    on++;
  }
  return on >= 4 ? { correct: true } : { correct: false, note: "I could not evaluate that equation." };
}

// ---------- entry point ----------

export function gradeMath(ans: string, want: string, meta: QuestionMeta | null): MathGrade | null {
  const kind: AnswerKind = meta?.kind ?? "number";
  if (kind === "text") return null;
  const answers = [want, ...(meta?.accept ?? [])];
  let best: MathGrade | null = null;
  for (const w of answers) {
    let g: MathGrade;
    switch (kind) {
      case "number": g = gradeNumber(ans, w); break;
      case "expr": g = gradeExpr(ans, w, meta?.domain); break;
      case "interval": g = gradeInterval(ans, w); break;
      case "set": g = gradeSet(ans, w); break;
      case "point": g = gradePoint(ans, w); break;
      case "equation": g = gradeEquation(ans, w, meta?.domain); break;
      default: return null;
    }
    if (g.correct) {
      const formNote = checkForm(ans, meta?.form);
      if (formNote) return { correct: false, note: formNote };
      return g;
    }
    best ??= g;
    if (!best.note && g.note) best = g;
  }
  return best;
}
