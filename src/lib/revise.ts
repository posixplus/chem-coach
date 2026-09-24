import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export type ReviseSheet = {
  slug: string;
  title: string;
  unit: number;
  test_date: string | null;
  summary: string;
  html: string;
  sections: { id: string; text: string }[];
};

const DIR = path.join(process.cwd(), "content", "revise");

function dateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Read every markdown sheet in content/revise (README excluded). Runs on the server at request time. */
export function listSheets(): Omit<ReviseSheet, "html" | "sections">[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map((f) => {
      const { data } = matter(fs.readFileSync(path.join(DIR, f), "utf8"));
      return {
        slug: String(data.slug ?? f.replace(/\.md$/, "")),
        title: String(data.title ?? f),
        unit: Number(data.unit ?? 0),
        test_date: dateStr(data.test_date),
        summary: String(data.summary ?? ""),
      };
    })
    .sort((a, b) => a.unit - b.unit || a.title.localeCompare(b.title));
}

export function getSheet(slug: string): ReviseSheet | null {
  if (!fs.existsSync(DIR)) return null;
  for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(DIR, f), "utf8");
    const { data, content } = matter(raw);
    const s = String(data.slug ?? f.replace(/\.md$/, ""));
    if (s !== slug) continue;
    const sections: { id: string; text: string }[] = [];
    const renderer = new marked.Renderer();
    renderer.heading = ({ text, depth }) => {
      const id = slugify(text);
      if (depth === 2) sections.push({ id, text });
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    };
    renderer.blockquote = ({ tokens }) => {
      const inner = marked.parser(tokens);
      const isTrap = /^\s*<p>\s*<strong>Trap:?<\/strong>/i.test(inner);
      return `<blockquote class="${isTrap ? "trap" : ""}">${inner}</blockquote>`;
    };
    const html = marked.parse(content, { renderer, gfm: true, breaks: false }) as string;
    return {
      slug: s,
      title: String(data.title ?? f),
      unit: Number(data.unit ?? 0),
      test_date: dateStr(data.test_date),
      summary: String(data.summary ?? ""),
      html,
      sections,
    };
  }
  return null;
}
