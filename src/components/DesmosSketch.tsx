"use client";

import { useEffect, useRef, useState } from "react";
import MathText from "./MathText";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Desmos?: any;
  }
}

const KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY || "";
let loading: Promise<void> | null = null;

function loadDesmos(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Desmos) return Promise.resolve();
  if (!KEY) return Promise.reject(new Error("NEXT_PUBLIC_DESMOS_API_KEY is not set"));
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${encodeURIComponent(KEY)}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load Desmos"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Sketch practice: Sachin graphs his own attempt in Desmos (equations or points), then reveals the
 * reference curve on top and self-checks against a feature list.
 */
export default function DesmosSketch({
  expressions,
  checklist,
  revealed,
  onReveal,
}: {
  expressions: string[];
  checklist: string[];
  revealed: boolean;
  onReveal: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const calc = useRef<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadDesmos()
      .then(() => {
        if (!alive || !box.current || !window.Desmos) return;
        calc.current = window.Desmos.GraphingCalculator(box.current, {
          expressions: true,
          settingsMenu: false,
          keypad: true,
          border: false,
        });
        calc.current.setMathBounds({ left: -10, right: 10, bottom: -10, top: 10 });
      })
      .catch((e) => alive && setErr(String(e.message ?? e)));
    return () => {
      alive = false;
      calc.current?.destroy?.();
      calc.current = null;
    };
  }, []);

  useEffect(() => {
    if (!revealed || !calc.current) return;
    expressions.forEach((latex, i) =>
      calc.current.setExpression({ id: `ref${i}`, latex, color: "#c2410c", lineStyle: window.Desmos?.Styles?.DASHED, secret: false }),
    );
  }, [revealed, expressions]);

  return (
    <div className="space-y-3">
      {err ? (
        <div className="rounded-lg bg-stone-100 p-3 text-sm text-stone-700">
          Desmos did not load here ({err}). Sketch it on paper or in{" "}
          <a className="underline" href="https://www.desmos.com/calculator" target="_blank" rel="noreferrer">
            desmos.com
          </a>
          , then reveal the answer below.
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-500">Type your own equation, or add points/a table in Desmos. Then reveal the reference graph (dashed orange).</p>
          <div ref={box} className="h-80 w-full overflow-hidden rounded-lg border border-stone-300" />
        </>
      )}
      {!revealed ? (
        <button type="button" className="btn-secondary" onClick={onReveal}>
          Reveal the answer
        </button>
      ) : (
        checklist.length > 0 && (
          <div className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
            <p className="font-medium">Check your sketch has all of these:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {checklist.map((c) => (
                <li key={c}>
                  <MathText text={c} />
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
