/**
 * Ingest course content into Supabase.
 *
 *   npm run ingest            -> writes directly to the database (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)
 *   npm run ingest -- --sql   -> prints SQL to stdout instead (handy for running through the Supabase SQL editor)
 *
 * What it does (idempotent, safe to re-run whenever you add files):
 *   - content/topics.json                     -> chem_topics
 *   - content/questions/*.json                -> chem_questions (source = "bank"; existing bank rows for the same prompt are updated)
 *   - content/notes/*.docx|*.md|*.txt         -> chem_notes_chunks (source = "teacher-notes"), chunked and tagged to a topic by keywords
 *   - content/textbook/*.txt                  -> chem_notes_chunks (source = "textbook")
 *   - content/agenda/*.xlsx                   -> chem_agenda (Mr. Knapik's weekly layout; periods filtered by MYP_PERIODS, default 2nd,6th,8th)
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

loadEnv({ path: ".env.local", override: false });

const ROOT = path.resolve(__dirname, "..", "content");
const SQL_MODE = process.argv.includes("--sql");
const MYP_PERIODS = (process.env.MYP_PERIODS || "2nd,6th,8th").split(",").map((s) => s.trim());

type Topic = { id: string; unit: number; unit_name: string; name: string; description: string; sort: number; keywords: string[] };
const topics: Topic[] = JSON.parse(fs.readFileSync(path.join(ROOT, "topics.json"), "utf8"));

const sqlOut: string[] = [];
const q = (v: unknown) => (v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "true" : "false") : `'${String(typeof v === "object" ? JSON.stringify(v) : v).replace(/'/g, "''")}'`);

const sb = SQL_MODE ? null : createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function upsertTopics() {
  const rows = topics.map((t) => ({ id: t.id, unit: t.unit, unit_name: t.unit_name, name: t.name, description: t.description, sort: t.sort }));
  if (SQL_MODE) {
    for (const t of rows) sqlOut.push(`insert into chem_topics (id, unit, unit_name, name, description, sort) values (${q(t.id)}, ${t.unit}, ${q(t.unit_name)}, ${q(t.name)}, ${q(t.description)}, ${t.sort}) on conflict (id) do update set unit=excluded.unit, unit_name=excluded.unit_name, name=excluded.name, description=excluded.description, sort=excluded.sort;`);
  } else {
    const { error } = await sb!.from("chem_topics").upsert(rows);
    if (error) throw error;
  }
  console.error(`topics: ${rows.length}`);
}

async function upsertQuestions() {
  const dir = path.join(ROOT, "questions");
  let n = 0;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const raw of arr) {
      const row = {
        topic_id: raw.topic_id,
        qtype: raw.qtype,
        prompt: raw.prompt,
        choices: raw.choices ?? null,
        answer: String(raw.answer),
        answer_unit: raw.answer_unit ?? null,
        tolerance_pct: raw.tolerance_pct ?? null,
        sig_figs: raw.sig_figs ?? null,
        explanation: raw.explanation ?? null,
        hint: raw.hint ?? null,
        difficulty: raw.difficulty ?? 2,
        source: "bank",
        active: true,
      };
      if (SQL_MODE) {
        sqlOut.push(`insert into chem_questions (topic_id, qtype, prompt, choices, answer, answer_unit, tolerance_pct, sig_figs, explanation, hint, difficulty, source, active)
select ${q(row.topic_id)}, ${q(row.qtype)}, ${q(row.prompt)}, ${row.choices ? q(row.choices) + "::jsonb" : "null"}, ${q(row.answer)}, ${q(row.answer_unit)}, ${q(row.tolerance_pct)}, ${q(row.sig_figs)}, ${q(row.explanation)}, ${q(row.hint)}, ${row.difficulty}, 'bank', true
where not exists (select 1 from chem_questions where source='bank' and prompt=${q(row.prompt)});`);
      } else {
        const { data: existing } = await sb!.from("chem_questions").select("id").eq("source", "bank").eq("prompt", row.prompt).maybeSingle();
        if (existing) await sb!.from("chem_questions").update(row).eq("id", existing.id);
        else {
          const { error } = await sb!.from("chem_questions").insert(row);
          if (error) throw error;
        }
      }
      n++;
    }
  }
  console.error(`questions: ${n}`);
}

function guessTopic(text: string): string | null {
  const t = text.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const tp of topics) {
    let score = 0;
    for (const k of tp.keywords) {
      const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      score += (t.match(re) ?? []).length;
    }
    if (score > 0 && (!best || score > best.score)) best = { id: tp.id, score };
  }
  return best?.id ?? null;
}

function chunkText(text: string, maxLen = 1600): { heading: string | null; content: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));
  const chunks: { heading: string | null; content: string }[] = [];
  let heading: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    const c = buf.join("\n").trim();
    if (c.length > 40) chunks.push({ heading, content: c });
    buf = [];
  };
  for (const l of lines) {
    const s = l.trim();
    const looksHeading = s.length > 2 && s.length < 70 && !/[.:;,]$/.test(s) && /^[A-Z0-9]/.test(s) && !/^\d+\.\s/.test(s) && s.split(" ").length <= 9 && !/[=+×]/.test(s);
    if (looksHeading && buf.join("\n").length > 200) {
      flush();
      heading = s;
      continue;
    }
    if (looksHeading && buf.length === 0) {
      heading = s;
      continue;
    }
    buf.push(l);
    if (buf.join("\n").length > maxLen) flush();
  }
  flush();
  return chunks;
}

async function replaceChunks(source: string, sourceFile: string, chunks: { heading: string | null; content: string; topic_id: string | null }[]) {
  const tag = `${source}:${sourceFile}`;
  if (SQL_MODE) {
    sqlOut.push(`delete from chem_notes_chunks where source=${q(tag)};`);
    for (const c of chunks) sqlOut.push(`insert into chem_notes_chunks (topic_id, source, heading, content) values (${q(c.topic_id)}, ${q(tag)}, ${q(c.heading)}, ${q(c.content)});`);
  } else {
    await sb!.from("chem_notes_chunks").delete().eq("source", tag);
    const { error } = await sb!.from("chem_notes_chunks").insert(chunks.map((c) => ({ ...c, source: tag })));
    if (error) throw error;
  }
  console.error(`${tag}: ${chunks.length} chunks`);
}

async function ingestNotes() {
  const dir = path.join(ROOT, "notes");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    let text = "";
    if (f.endsWith(".docx")) text = (await mammoth.extractRawText({ path: p })).value;
    else if (f.endsWith(".md") || f.endsWith(".txt")) text = fs.readFileSync(p, "utf8");
    else if (f.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: fs.readFileSync(p) });
      text = (await parser.getText()).text;
    } else continue;
    const chunks = chunkText(text).map((c) => ({ ...c, topic_id: guessTopic((c.heading ?? "") + " " + c.content) }));
    await replaceChunks("teacher-notes", f, chunks);
  }
}

async function ingestTextbook() {
  const dir = path.join(ROOT, "textbook");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".txt"))) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    // Split on section numbers like "1.5 Significant Figures"
    const parts = text.split(/\n(?=\d{1,2}\.\d{1,2} [A-Z][^\n]{3,60}\n)/);
    const chunks: { heading: string | null; content: string; topic_id: string | null }[] = [];
    for (const part of parts) {
      const heading = part.split("\n")[0].trim();
      for (const c of chunkText(part, 2200)) {
        const topic = guessTopic(heading + " " + c.content);
        if (topic) chunks.push({ heading: heading.slice(0, 80), content: c.content, topic_id: topic });
      }
    }
    await replaceChunks("textbook", f, chunks);
  }
}

function agendaKind(text: string): string {
  const t = text.toLowerCase();
  if (/\btest\b/.test(t) && !/test practice/.test(t)) return "test";
  if (/\bquiz\b/.test(t)) return "quiz";
  if (/\blab\b/.test(t)) return "lab";
  if (/\bdue\b/.test(t)) return "due";
  return "other";
}

function agendaTopic(text: string): string | null {
  const t = text.toLowerCase();
  if (/element/.test(t)) return "u2-elements20";
  if (/dimensional/.test(t)) return "u1-da";
  if (/sig ?fig/.test(t)) return "u1-sigfigs";
  if (/chemical foundations/.test(t)) return null; // whole unit: mixed drill
  return guessTopic(text);
}

async function ingestAgenda() {
  const dir = path.join(ROOT, "agenda");
  if (!fs.existsSync(dir)) return;
  const rows: { date: string; text: string; kind: string; topic_id: string | null }[] = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".xlsx"))) {
    const wb = XLSX.readFile(path.join(dir, f), { cellDates: true });
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      const grid: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
      // Locate the layout from the header row: the "Week of:" label column, the period column right after it,
      // and the five weekday columns starting at "Mon".
      let labelCol = -1, monCol = -1;
      for (const r of grid) {
        const i = r.findIndex((v) => typeof v === "string" && /week of/i.test(v));
        if (i >= 0 && (labelCol < 0 || i < labelCol)) {
          const m = r.findIndex((v, j) => j > i && typeof v === "string" && /^mon/i.test(v));
          if (m > 0) { labelCol = i; monCol = m; }
        }
      }
      if (labelCol < 0 || monCol < 0) continue;
      let weekStart: Date | null = null;
      for (const r of grid) {
        const b = r[labelCol], c = r[labelCol + 1];
        if (b instanceof Date) weekStart = new Date(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()));
        else if (typeof b === "number" && b > 40000) { const d = XLSX.SSF.parse_date_code(b); weekStart = d ? new Date(Date.UTC(d.y, d.m - 1, d.d)) : null; }
        else if (typeof b === "string" && /^\d{4}-\d{2}-\d{2}/.test(b)) weekStart = new Date(b.slice(0, 10) + "T00:00:00Z");
        else if (typeof b === "string" && /week of/i.test(b)) weekStart = null;
        if (!weekStart || typeof c !== "string" || !MYP_PERIODS.includes(c.trim())) continue;
        for (let day = 0; day < 5; day++) {
          const cell = r[monCol + day];
          if (typeof cell !== "string" || !cell.trim()) continue;
          const d = new Date(weekStart.getTime());
          d.setUTCDate(d.getUTCDate() + day);
          const date = d.toISOString().slice(0, 10);
          for (const line of cell.split(/\n/).map((s) => s.trim()).filter(Boolean)) {
            if (/no school/i.test(line)) continue;
            if (!rows.some((x) => x.date === date && x.text === line)) rows.push({ date, text: line, kind: agendaKind(line), topic_id: agendaTopic(line) });
          }
        }
      }
    }
  }
  if (SQL_MODE) {
    sqlOut.push(`delete from chem_agenda;`);
    for (const r of rows) sqlOut.push(`insert into chem_agenda (date, text, kind, topic_id) values (${q(r.date)}, ${q(r.text)}, ${q(r.kind)}, ${q(r.topic_id)});`);
  } else {
    await sb!.from("chem_agenda").delete().neq("kind", "__none__");
    if (rows.length) {
      const { error } = await sb!.from("chem_agenda").insert(rows);
      if (error) throw error;
    }
  }
  console.error(`agenda: ${rows.length} items (${rows.filter((r) => r.kind === "test" || r.kind === "quiz").length} quizzes/tests)`);
}

(async () => {
  await upsertTopics();
  await upsertQuestions();
  await ingestNotes();
  await ingestTextbook();
  await ingestAgenda();
  if (SQL_MODE) process.stdout.write(sqlOut.join("\n") + "\n");
  console.error("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
