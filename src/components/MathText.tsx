import katex from "katex";

/** Render text with $...$ (inline) and $$...$$ (display) LaTeX. Works in server and client components. */
export function renderMathHtml(text: string): string {
  // Plain text between the TeX: escape, then allow **bold** (used in prompts like "State the **domain**").
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const out: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push(esc(text.slice(last, m.index)));
    const tex = m[1] ?? m[2];
    try {
      out.push(katex.renderToString(tex, { displayMode: !!m[1], throwOnError: false, output: "html" }));
    } catch {
      out.push(esc(m[0]));
    }
    last = m.index + m[0].length;
  }
  out.push(esc(text.slice(last)));
  return out.join("");
}

export default function MathText({ text, className, as = "span" }: { text: string; className?: string; as?: "span" | "p" | "div" }) {
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: renderMathHtml(text) }} />;
}
