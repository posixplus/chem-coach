"use client";

import { useMemo } from "react";
import { create, all } from "mathjs";
import type { GraphSpec, GraphCurve } from "@/lib/supabase";

const math = create(all, { number: "number" });

const W = 360;
const PAD = 22;

/** Grid-paper graph like the worksheets: integer grid, labelled axes, curves, open/closed dots, dashed asymptotes. */
export default function GraphView({ spec, size = W, className }: { spec: GraphSpec; size?: number; className?: string }) {
  const { xmin, xmax, ymin, ymax } = spec;
  const step = spec.step ?? 1;
  const inner = size - 2 * PAD;
  const sx = (x: number) => PAD + ((x - xmin) / (xmax - xmin)) * inner;
  const sy = (y: number) => PAD + ((ymax - y) / (ymax - ymin)) * inner;

  const paths = useMemo(() => spec.curves.map((c) => curvePaths(c, spec, sx, sy)), [spec]); // eslint-disable-line react-hooks/exhaustive-deps

  const gridX: number[] = [];
  for (let x = Math.ceil(xmin / step) * step; x <= xmax + 1e-9; x += step) gridX.push(x);
  const gridY: number[] = [];
  for (let y = Math.ceil(ymin / step) * step; y <= ymax + 1e-9; y += step) gridY.push(y);
  const labelEvery = Math.max(1, Math.round(gridX.length / 10));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className ?? "w-full max-w-sm"} role="img" aria-label="graph">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f766e" />
        </marker>
        <marker id="axarr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1c1917" />
        </marker>
      </defs>
      <rect x={PAD} y={PAD} width={inner} height={inner} fill="white" />
      {gridX.map((x) => (
        <line key={`gx${x}`} x1={sx(x)} x2={sx(x)} y1={PAD} y2={size - PAD} stroke="#e7e5e4" strokeWidth={1} />
      ))}
      {gridY.map((y) => (
        <line key={`gy${y}`} y1={sy(y)} y2={sy(y)} x1={PAD} x2={size - PAD} stroke="#e7e5e4" strokeWidth={1} />
      ))}
      {/* axes */}
      {ymin <= 0 && ymax >= 0 && <line x1={PAD - 8} x2={size - PAD + 8} y1={sy(0)} y2={sy(0)} stroke="#1c1917" strokeWidth={1.4} markerStart="url(#axarr)" markerEnd="url(#axarr)" />}
      {xmin <= 0 && xmax >= 0 && <line y1={PAD - 8} y2={size - PAD + 8} x1={sx(0)} x2={sx(0)} stroke="#1c1917" strokeWidth={1.4} markerStart="url(#axarr)" markerEnd="url(#axarr)" />}
      {spec.labels !== false && (
        <g fontSize={9} fill="#57534e">
          {gridX.filter((x, i) => x !== 0 && i % labelEvery === 0).map((x) => (
            <text key={`lx${x}`} x={sx(x)} y={Math.min(size - 4, Math.max(PAD + 10, sy(0) + 11))} textAnchor="middle">{fmt(x)}</text>
          ))}
          {gridY.filter((y, i) => y !== 0 && i % labelEvery === 0).map((y) => (
            <text key={`ly${y}`} x={Math.min(size - 6, Math.max(PAD + 2, sx(0) - 4))} y={sy(y) + 3} textAnchor="end">{fmt(y)}</text>
          ))}
          <text x={size - PAD + 4} y={Math.max(PAD, Math.min(size - PAD, sy(0))) - 6} fontStyle="italic">x</text>
          <text x={Math.max(PAD, Math.min(size - PAD, sx(0))) + 6} y={PAD - 6} fontStyle="italic">y</text>
        </g>
      )}
      {(spec.asymptotes ?? []).map((a, i) =>
        a.x !== undefined ? (
          <line key={`as${i}`} x1={sx(a.x)} x2={sx(a.x)} y1={PAD} y2={size - PAD} stroke="#b45309" strokeDasharray="5 4" strokeWidth={1.3} />
        ) : (
          <line key={`as${i}`} y1={sy(a.y!)} y2={sy(a.y!)} x1={PAD} x2={size - PAD} stroke="#b45309" strokeDasharray="5 4" strokeWidth={1.3} />
        ),
      )}
      <g clipPath="none">
        {paths.map((ps, i) =>
          ps.map((p, j) => (
            <path
              key={`c${i}-${j}`}
              d={p.d}
              fill="none"
              stroke={spec.curves[i].color ?? "#0f766e"}
              strokeWidth={2.2}
              strokeDasharray={spec.curves[i].dashed ? "6 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ color: spec.curves[i].color ?? "#0f766e" }}
              markerStart={p.arrowStart ? "url(#arr)" : undefined}
              markerEnd={p.arrowEnd ? "url(#arr)" : undefined}
            />
          )),
        )}
      </g>
      {(spec.dots ?? []).map((d, i) => (
        <circle key={`d${i}`} cx={sx(d.x)} cy={sy(d.y)} r={4} fill={d.open ? "white" : "#0f766e"} stroke="#0f766e" strokeWidth={2} />
      ))}
    </svg>
  );
}

function fmt(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

type P = { d: string; arrowStart: boolean; arrowEnd: boolean };

function curvePaths(c: GraphCurve, spec: GraphSpec, sx: (x: number) => number, sy: (y: number) => number): P[] {
  const pad = 0.02 * (spec.ymax - spec.ymin);
  const inY = (y: number) => y >= spec.ymin - pad && y <= spec.ymax + pad;
  const segments: [number, number][][] = [];
  if (c.points) {
    const pts = c.smooth ? catmullRom(c.points) : c.points;
    segments.push(pts);
  } else if (c.fn) {
    let f: (x: number) => number;
    try {
      const code = math.compile(c.fn);
      f = (x: number) => {
        const v = code.evaluate({ x });
        return typeof v === "number" ? v : NaN;
      };
    } catch {
      return [];
    }
    const a = c.from ?? spec.xmin;
    const b = c.to ?? spec.xmax;
    const N = 600;
    let cur: [number, number][] = [];
    let prevY: number | null = null;
    for (let i = 0; i <= N; i++) {
      const x = a + ((b - a) * i) / N;
      const y = f(x);
      const ok = Number.isFinite(y) && inY(y);
      // Break the path at asymptotes (huge jumps) or when leaving the window.
      if (!ok || (prevY !== null && Math.abs(y - prevY) > (spec.ymax - spec.ymin) * 0.8)) {
        if (cur.length > 1) segments.push(cur);
        cur = ok ? [[x, y]] : [];
      } else cur.push([x, y]);
      prevY = Number.isFinite(y) ? y : null;
    }
    if (cur.length > 1) segments.push(cur);
  }
  return segments.map((seg, i) => ({
    d: seg.map(([x, y], k) => `${k ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" "),
    arrowStart: (c.arrows === "start" || c.arrows === "both") && i === 0,
    arrowEnd: (c.arrows === "end" || c.arrows === "both") && i === segments.length - 1,
  }));
}

function catmullRom(pts: [number, number][], n = 12): [number, number][] {
  if (pts.length < 3) return pts;
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < n; t++) {
      const s = t / n, s2 = s * s, s3 = s2 * s;
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3);
      const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3);
      out.push([x, y]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
