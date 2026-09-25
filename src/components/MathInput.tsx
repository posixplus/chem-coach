"use client";

import { forwardRef, useMemo, useRef, useImperativeHandle } from "react";
import katex from "katex";
import { parse } from "mathjs";
import { normalizeMath } from "@/lib/mathgrade";
import type { AnswerKind } from "@/lib/supabase";

type Key = { label: string; insert: string; back?: number; title?: string };

const K = (label: string, insert = label, back = 0, title?: string): Key => ({ label, insert, back, title });

const KEYS: Record<string, Key[]> = {
  number: [K("/", "/"), K("√", "√()", 1, "square root"), K("∛", "∛()", 1, "cube root"), K("^", "^"), K("π"), K("−", "-"), K("log", "log()", 1), K("ln", "ln()", 1)],
  expr: [K("x"), K("^", "^"), K("x²", "x^2"), K("/", "/"), K("( )", "()", 1), K("√", "√()", 1), K("∛", "∛()", 1), K("|x|", "abs()", 1, "absolute value"), K("π")],
  equation: [K("y ="), K("x"), K("^", "^"), K("/", "/"), K("( )", "()", 1), K("√", "√()", 1)],
  interval: [K("["), K("("), K(")"), K("]"), K("−∞", "-∞"), K("∞"), K("∪", " ∪ "), K(",", ", ")],
  set: [K("x ="), K(","), K("±"), K("/"), K("√", "√()", 1), K("none")],
  point: [K("( , )", "(, )", 3), K("/"), K("−", "-")],
};

const HELP: Partial<Record<AnswerKind, string>> = {
  number: "Exact values: -2/3, √(5)/5, 67/6",
  expr: "Use x, ^ for powers: 2x^2 + 3x - 1",
  equation: "Like y = -2x - 8",
  interval: "Interval notation: [-3, 5) or (-∞, 1) ∪ (1, ∞)",
  set: "Separate with commas: x = 4, x = -4 (or none)",
  point: "A point: (0, -2)",
};

export type MathInputHandle = { focus: () => void };

function preview(value: string, kind: AnswerKind): string | null {
  const v = value.trim();
  if (!v) return null;
  const pretty = (s: string) => s.replace(/-?inf(inity)?/gi, (m) => (m.startsWith("-") ? "-∞" : "∞")).replace(/\bU\b/g, "∪").replace(/sqrt/g, "√");
  if (kind === "interval" || kind === "set" || kind === "point") return null;
  try {
    let s = normalizeMath(v);
    let lhs = "";
    const eq = s.split("=");
    if (eq.length === 2) {
      lhs = eq[0].trim();
      s = eq[1];
    }
    const tex = parse(s).toTex({ parenthesis: "auto", implicit: "hide" });
    const lhsTex = lhs ? (/^[a-z]$/i.test(lhs) ? lhs : parse(lhs).toTex({ implicit: "hide" })) + " = " : "";
    return katex.renderToString(lhsTex + tex, { throwOnError: false });
  } catch {
    return pretty(v) === v ? null : pretty(v);
  }
}

const MathInput = forwardRef<MathInputHandle, { value: string; onChange: (v: string) => void; kind: AnswerKind; disabled?: boolean; placeholder?: string | null }>(
  function MathInput({ value, onChange, kind, disabled, placeholder }, ref) {
    const el = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({ focus: () => el.current?.focus() }));
    const prev = useMemo(() => preview(value, kind), [value, kind]);
    const keys = KEYS[kind] ?? KEYS.number;

    const insert = (k: Key) => {
      const input = el.current;
      if (!input) return;
      if (k.insert === "none") {
        onChange("none");
        input.focus();
        return;
      }
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const next = value.slice(0, start) + k.insert + value.slice(end);
      onChange(next);
      const pos = start + k.insert.length - (k.back ?? 0);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(pos, pos);
      });
    };

    return (
      <div className="space-y-2">
        <input
          ref={el}
          className="input font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? HELP[kind] ?? "Your answer"}
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-1">
          {keys.map((k) => (
            <button
              key={k.label}
              type="button"
              title={k.title ?? k.label}
              disabled={disabled}
              onClick={() => insert(k)}
              className="min-w-9 rounded-md border border-stone-300 bg-stone-50 px-2 py-1 font-mono text-sm text-stone-800 hover:bg-stone-100"
            >
              {k.label}
            </button>
          ))}
        </div>
        {prev && (
          <p className="text-sm text-stone-600">
            Reads as: <span dangerouslySetInnerHTML={{ __html: prev }} />
          </p>
        )}
      </div>
    );
  },
);

export default MathInput;
