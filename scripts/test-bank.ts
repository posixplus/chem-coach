/**
 * Checks every math bank question against the app's own grader:
 *  - the stored answer (and every accepted alternative) grades correct
 *  - every listed wrong answer (the classic slips) grades wrong
 *  - MCQ answers are among the choices; graphs parse; sketch items have a reference
 */
import fs from "node:fs";
import path from "node:path";
import { create, all } from "mathjs";
import { gradeMath } from "../src/lib/mathgrade";
import type { QuestionMeta, GraphSpec } from "../src/lib/supabase";

const math = create(all, { number: "number" });
const dir = path.join(__dirname, "..", "content", "math", "questions");
type Q = { topic_id: string; qtype: string; prompt: string; answer: string; choices: string[] | null; meta: QuestionMeta | null; graph: GraphSpec | null; wrong?: string[] };

const topics = new Set((JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content", "math", "topics.json"), "utf8")) as { id: string }[]).map((t) => t.id));
let n = 0, fail = 0;
const bad = (msg: string) => {
  fail++;
  console.log("FAIL " + msg);
};

function checkGraph(g: GraphSpec | null | undefined, where: string) {
  if (!g) return;
  for (const c of g.curves) {
    if (!c.fn) continue;
    try {
      const f = math.compile(c.fn);
      const mid = ((c.from ?? g.xmin) + (c.to ?? g.xmax)) / 2 + 0.123;
      const v = f.evaluate({ x: mid });
      if (typeof v !== "number") bad(`${where}: graph fn ${c.fn} gave ${v}`);
    } catch (e) {
      bad(`${where}: graph fn ${c.fn} does not parse (${e})`);
    }
  }
}

for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const qs = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Q[];
  for (const q of qs) {
    n++;
    const where = `${f}: ${q.prompt.slice(0, 70)}`;
    if (!topics.has(q.topic_id)) bad(`${where}: unknown topic ${q.topic_id}`);
    checkGraph(q.graph, where);
    if (q.qtype === "mcq") {
      if (!q.choices?.includes(q.answer)) bad(`${where}: answer not in choices`);
      for (const g of Object.values(q.meta?.choice_graphs ?? {})) checkGraph(g, where);
      continue;
    }
    if (q.qtype === "sketch") {
      if (!q.meta?.desmos?.length || !q.meta.checklist?.length) bad(`${where}: sketch needs desmos + checklist`);
      continue;
    }
    if (q.qtype !== "math") continue;
    if (q.meta?.kind === "text") continue;
    for (const a of [q.answer, ...(q.meta?.accept ?? [])]) {
      const r = gradeMath(a, q.answer, q.meta);
      if (!r?.correct) bad(`${where}: own answer "${a}" graded ${JSON.stringify(r)}`);
    }
    for (const w of q.wrong ?? []) {
      const r = gradeMath(w, q.answer, q.meta);
      if (r?.correct) bad(`${where}: wrong answer "${w}" graded correct`);
    }
  }
}
console.log(fail ? `${fail} bank problems in ${n} questions` : `bank tests passed (${n} questions)`);
if (fail) process.exit(1);
