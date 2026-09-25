/**
 * Ingest course content into Supabase, for every subject.
 *
 *   npm run ingest                 -> all subjects
 *   npm run ingest -- math         -> one subject (chem | math)
 *
 * Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local (and ANTHROPIC_API_KEY to transcribe math PDFs).
 * Idempotent: safe to re-run whenever you add files.
 *
 * Layout (chem lives at the content root for historical reasons; math under content/math):
 *   <root>/topics.json                   -> chem_topics
 *   <root>/questions/*.json              -> chem_questions (source "bank"; matched by prompt; bank rows removed from the files are deactivated)
 *   <root>/notes/*.docx|md|txt|pdf       -> chem_notes_chunks (source "teacher-notes:<file>"), tagged to topics by keywords
 *                                           math PDFs are transcribed by Claude once and cached in notes/.transcripts/<file>.md
 *   <root>/textbook/*.txt                -> chem_notes_chunks (source "textbook:<file>")
 *   content/revise/*.md (by subject)     -> chem_notes_chunks (source "revise:<file>") so the tutor sees the revision sheets
 *   <root>/agenda/*.xlsx                 -> chem_agenda (Mr. Knapik's weekly layout; periods filtered by MYP_PERIODS)
 *   <root>/agenda/*.docx                 -> chem_agenda (Mrs. Yan's month-by-month calendar tables)
 *   <root>/agenda/dates.json             -> chem_agenda (hand-entered dates: [{date, text, kind, topic_id}])
 * Agenda rows added on the parent dashboard (source "manual") are never touched.
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import matter from "gray-matter";
import { parse as parseHtml, type HTMLElement } from "node-html-parser";
import Anthropic from "@anthropic-ai/sdk";

loadEnv({ path: ".env.local", override: false });

type Subject = "chem" | "math";
const CONTENT = path.resolve(__dirname, "..", "content");
const ROOTS: Record<Subject, string> = { chem: CONTENT, math: path.join(CONTENT, "math") };
const MYP_PERIODS = (process.env.MYP_PERIODS || "2nd,6th,8th").split(",").map((s) => s.trim());
const only = process.argv.slice(2).find((a) => a === "chem" || a === "math") as Subject | undefined;

type Topic = { id: string; unit: number; unit_name: string; name: string; description: string; sort: number; keywords: string[] };

const sb = createClient(process.env.SUPABASE_URL || "http://localhost", process.env.SUPABASE_SERVICE_ROLE_KEY || "x", { auth: { persistSession: false } });

function loadTopics(subject: Subject): Topic[] {
  const f = path.join(ROOTS[subject], "topics.json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : [];
}

async function upsertTopics(subject: Subject, topics: Topic[]) {
  const rows = topics.map((t) => ({ id: t.id, unit: t.unit, unit_name: t.unit_name, name: t.name, description: t.description, sort: t.sort, subject }));
  if (!rows.length) return;
  const { error } = await sb.from("chem_topics").upsert(rows);
  if (error) throw error;
  console.error(`[${subject}] topics: ${rows.length}`);
}

async function upsertQuestions(subject: Subject) {
  const dir = path.join(ROOTS[subject], "questions");
  if (!fs.existsSync(dir)) return;
  const prompts = new Set<string>();
  let n = 0, added = 0;
  const { data: existingRows } = await sb.from("chem_questions").select("id, prompt").eq("source", "bank").eq("subject", subject).limit(5000);
  const byPrompt = new Map((existingRows ?? []).map((r) => [r.prompt as string, r.id as string]));
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
        subject,
        meta: raw.meta ?? null,
        graph: raw.graph ?? null,
        calc: raw.calc ?? null,
      };
      prompts.add(row.prompt);
      const id = byPrompt.get(row.prompt);
      if (id) {
        const { error } = await sb.from("chem_questions").update(row).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("chem_questions").insert(row);
        if (error) throw error;
        added++;
      }
      n++;
    }
  }
  // Bank questions deleted or reworded in the files: deactivate the old rows (attempt history stays intact).
  const stale = [...byPrompt.entries()].filter(([p]) => !prompts.has(p)).map(([, id]) => id);
  if (stale.length) await sb.from("chem_questions").update({ active: false }).in("id", stale);
  console.error(`[${subject}] questions: ${n} (${added} new, ${stale.length} retired)`);
}

function guessTopic(topics: Topic[], text: string): string | null {
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
    const md = s.match(/^#{1,4}\s+(.+)$/);
    const looksHeading = !!md || (s.length > 2 && s.length < 70 && !/[.:;,]$/.test(s) && /^[A-Z0-9]/.test(s) && !/^\d+\.\s/.test(s) && s.split(" ").length <= 9 && !/[=+×$\\]/.test(s));
    const h = md ? md[1] : s;
    if (looksHeading && buf.join("\n").length > 200) {
      flush();
      heading = h;
      continue;
    }
    if (looksHeading && buf.length === 0) {
      heading = h;
      continue;
    }
    buf.push(l);
    if (buf.join("\n").length > maxLen) flush();
  }
  flush();
  return chunks;
}

async function replaceChunks(subject: Subject, tag: string, chunks: { heading: string | null; content: string; topic_id: string | null }[]) {
  await sb.from("chem_notes_chunks").delete().eq("source", tag);
  if (chunks.length) {
    const { error } = await sb.from("chem_notes_chunks").insert(chunks.map((c) => ({ ...c, source: tag, subject })));
    if (error) throw error;
  }
  console.error(`[${subject}] ${tag}: ${chunks.length} chunks`);
}

/** Math worksheets lose their structure in plain PDF text, and scans have none. Claude reads the PDF once; the result is cached. */
export async function transcribePdf(file: string): Promise<string> {
  const buf = fs.readFileSync(file);
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);
  const cacheDir = path.join(path.dirname(file), ".transcripts");
  const cache = path.join(cacheDir, `${path.basename(file, ".pdf")}.${hash}.md`);
  if (fs.existsSync(cache)) return fs.readFileSync(cache, "utf8");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is needed to transcribe " + file);
  const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.error(`  transcribing ${path.basename(file)} with Claude…`);
  const res = await ai.messages.create({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } },
          {
            type: "text",
            text:
              "Transcribe this math class handout into markdown for a tutor's reference notes. Use ## headings for each section, keep the numbering, and write all math in LaTeX between single dollar signs. " +
              "For graphs, describe them in one line each (shape, key points, open/closed endpoints, arrows, asymptotes). Only if handwritten answers are actually present, include them after each problem as 'Student work:' and flag anything that looks wrong with 'CHECK:'. Output only the markdown.",
          },
        ],
      },
    ],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cache, text);
  return text;
}

async function ingestNotes(subject: Subject, topics: Topic[]) {
  const dir = path.join(ROOTS[subject], "notes");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) continue;
    let text = "";
    if (f.endsWith(".docx")) text = (await mammoth.extractRawText({ path: p })).value;
    else if (f.endsWith(".md") || f.endsWith(".txt")) text = fs.readFileSync(p, "utf8");
    else if (f.endsWith(".pdf")) {
      if (subject === "math") text = await transcribePdf(p);
      else {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: fs.readFileSync(p) });
        text = (await parser.getText()).text;
      }
    } else continue;
    const chunks = chunkText(text).map((c) => ({ ...c, topic_id: guessTopic(topics, (c.heading ?? "") + " " + c.content) }));
    await replaceChunks(subject, `teacher-notes:${f}`, chunks);
  }
}

async function ingestTextbook(subject: Subject, topics: Topic[]) {
  const dir = path.join(ROOTS[subject], "textbook");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".txt"))) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    const parts = text.split(/\n(?=\d{1,2}\.\d{1,2} [A-Z][^\n]{3,60}\n)/);
    const chunks: { heading: string | null; content: string; topic_id: string | null }[] = [];
    for (const part of parts) {
      const heading = part.split("\n")[0].trim();
      for (const c of chunkText(part, 2200)) {
        const topic = guessTopic(topics, heading + " " + c.content);
        if (topic) chunks.push({ heading: heading.slice(0, 80), content: c.content, topic_id: topic });
      }
    }
    await replaceChunks(subject, `textbook:${f}`, chunks);
  }
}

/** Revision sheets double as tutor context: one chunk per ## section. */
async function ingestRevise(subject: Subject, topics: Topic[]) {
  const dir = path.join(CONTENT, "revise");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")) {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    if (String(data.subject ?? "chem") !== subject) continue;
    const chunks = content
      .split(/\n(?=## )/)
      .map((sec) => {
        const heading = sec.match(/^## (.+)/)?.[1]?.trim() ?? null;
        return { heading, content: sec.trim(), topic_id: guessTopic(topics, sec) };
      })
      .filter((c) => c.content.length > 40);
    await replaceChunks(subject, `revise:${f}`, chunks);
  }
}

// ---------- agenda ----------

type AgendaRow = { date: string; text: string; kind: string; topic_id: string | null; url?: string | null };

function agendaKind(text: string): string {
  const t = text.toLowerCase();
  if (/\btest\b/.test(t) && !/test practice|test review|test correction/.test(t)) return "test";
  if (/\bquiz\b/.test(t)) return "quiz";
  if (/\blab\b/.test(t)) return "lab";
  if (/\bdue\b|^hw:/.test(t)) return "due";
  return "other";
}

function chemAgendaTopic(topics: Topic[], text: string): string | null {
  const t = text.toLowerCase();
  if (/element/.test(t)) return "u2-elements20";
  if (/dimensional/.test(t)) return "u1-da";
  if (/sig ?fig/.test(t)) return "u1-sigfigs";
  if (/chemical foundations/.test(t)) return null;
  return guessTopic(topics, text);
}

function xlsxAgenda(file: string, topics: Topic[]): AgendaRow[] {
  const rows: AgendaRow[] = [];
  const wb = XLSX.readFile(file, { cellDates: true });
  for (const name of wb.SheetNames) {
    const grid: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null });
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
          if (!rows.some((x) => x.date === date && x.text === line)) rows.push({ date, text: line, kind: agendaKind(line), topic_id: chemAgendaTopic(topics, line) });
        }
      }
    }
  }
  return rows;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** Expand a table (with rowspan/colspan) into a grid of cells. */
function tableGrid(table: HTMLElement): (HTMLElement | null)[][] {
  const grid: (HTMLElement | null)[][] = [];
  const rows = table.querySelectorAll("tr");
  rows.forEach((tr, r) => {
    grid[r] ??= [];
    let c = 0;
    for (const cell of tr.querySelectorAll("th, td")) {
      while (grid[r][c] !== undefined) c++;
      const rs = Number(cell.getAttribute("rowspan") ?? 1);
      const cs = Number(cell.getAttribute("colspan") ?? 1);
      for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) {
        grid[r + i] ??= [];
        grid[r + i][c + j] = i === 0 && j === 0 ? cell : null;
      }
      c += cs;
    }
  });
  return grid;
}

const cellText = (el: HTMLElement | null) => (el ? el.structuredText.replace(/\s+/g, " ").trim() : "");

/**
 * Mrs. Yan's calendar: a "<Month> <Year>" paragraph, then one table per week. Row 0 has the day numbers
 * (Mon..Fri in columns 1..5), later rows are labelled Topic / Objective / Lesson or Activity / Homework / Resources.
 * Day numbers are sometimes wrong (a "1" for the 7th), so each week's Monday is found by voting across the columns.
 */
export function docxCalendar(html: string, topics: Topic[]): AgendaRow[] {
  const root = parseHtml(html);
  const rows: AgendaRow[] = [];
  let year = new Date().getFullYear();
  let month = -1;
  let lastMonday: Date | null = null;
  for (const el of root.childNodes as HTMLElement[]) {
    const tag = (el.tagName ?? "").toLowerCase();
    if (tag === "p") {
      const m = el.text.trim().match(/^([A-Za-z]+)\s+(\d{4})/);
      if (m && MONTHS.includes(m[1].toLowerCase())) {
        month = MONTHS.indexOf(m[1].toLowerCase());
        year = Number(m[2]);
      }
      continue;
    }
    if (tag !== "table" || month < 0) continue;
    const grid = tableGrid(el);
    if (!grid.length) continue;
    // Vote for this week's Monday.
    const votes = new Map<string, number>();
    for (let col = 1; col <= 5; col++) {
      const d = Number(cellText(grid[0]?.[col] ?? null));
      if (!Number.isInteger(d) || d < 1 || d > 31) continue;
      for (const dm of [-1, 0, 1]) {
        const dt = new Date(Date.UTC(year, month + dm, d));
        if (dt.getUTCDate() !== d) continue;
        if (dt.getUTCDay() !== col) continue; // col 1 = Monday
        const mon = new Date(dt.getTime() - (col - 1) * 86400000).toISOString().slice(0, 10);
        votes.set(mon, (votes.get(mon) ?? 0) + 1);
      }
    }
    let monday: Date | null = null;
    const best = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) monday = new Date(best[0] + "T00:00:00Z");
    else if (lastMonday) monday = new Date(lastMonday.getTime() + 7 * 86400000);
    if (!monday) continue;
    lastMonday = monday;

    const label = (r: number) => cellText(grid[r]?.[0] ?? null).toLowerCase();
    let weekTopic = ""; // a topic set on Monday carries through the week's later lessons
    for (let col = 1; col <= 5; col++) {
      const date = new Date(monday.getTime() + (col - 1) * 86400000).toISOString().slice(0, 10);
      let topic = "", lesson = "", hw = "", url: string | null = null;
      for (let r = 1; r < grid.length; r++) {
        const cell = grid[r]?.[col] ?? null;
        const t = cellText(cell);
        if (!t) continue;
        const l = label(r);
        if (/^topic/.test(l)) topic = t;
        else if (/^lesson|^objective/.test(l)) {
          lesson = lesson ? `${lesson}; ${t}` : t;
          url ??= cell?.querySelector("a")?.getAttribute("href") ?? null;
        } else if (/^homework/.test(l)) hw = t;
      }
      if (/holiday|no school/i.test(topic + lesson)) continue;
      if (topic && !/quiz|test/i.test(topic)) weekTopic = topic;
      else if (!topic && lesson && weekTopic) topic = weekTopic;
      const main = topic || lesson;
      if (main) {
        const text = topic && lesson && lesson.length < 90 ? `${topic}: ${lesson}` : main;
        rows.push({ date, text: text.slice(0, 160), kind: agendaKind(topic || lesson), topic_id: guessTopic(topics, topic + " " + lesson + " " + hw), url });
      }
      if (hw && !/syllabus/i.test(hw)) rows.push({ date, text: `HW: ${hw}`.slice(0, 160), kind: "due", topic_id: guessTopic(topics, hw) });
    }
  }
  return rows;
}

async function ingestAgenda(subject: Subject, topics: Topic[]) {
  const dir = path.join(ROOTS[subject], "agenda");
  if (!fs.existsSync(dir)) return;
  const rows: AgendaRow[] = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (f.endsWith(".xlsx")) rows.push(...xlsxAgenda(p, topics));
    else if (f.endsWith(".docx")) rows.push(...docxCalendar((await mammoth.convertToHtml({ path: p })).value, topics));
    else if (f === "dates.json") {
      for (const r of JSON.parse(fs.readFileSync(p, "utf8")) as AgendaRow[]) rows.push({ ...r, kind: r.kind ?? agendaKind(r.text), topic_id: r.topic_id ?? null });
    }
  }
  const { error: delErr } = await sb.from("chem_agenda").delete().eq("subject", subject).eq("source", "ingest");
  if (delErr) throw delErr;
  if (rows.length) {
    const { error } = await sb.from("chem_agenda").insert(rows.map((r) => ({ ...r, subject, source: "ingest" })));
    if (error) throw error;
  }
  console.error(`[${subject}] agenda: ${rows.length} items (${rows.filter((r) => r.kind === "test" || r.kind === "quiz").length} quizzes/tests)`);
}

export { loadTopics };

if (require.main === module) (async () => {
  for (const subject of (only ? [only] : ["chem", "math"]) as Subject[]) {
    const topics = loadTopics(subject);
    if (!topics.length) continue;
    await upsertTopics(subject, topics);
    await upsertQuestions(subject);
    await ingestNotes(subject, topics);
    await ingestTextbook(subject, topics);
    await ingestRevise(subject, topics);
    await ingestAgenda(subject, topics);
  }
  console.error("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
