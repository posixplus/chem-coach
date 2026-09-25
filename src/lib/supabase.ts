import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/** Server-only Supabase client using the service role key. Never import from client components. */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export type Topic = {
  id: string;
  unit: number;
  unit_name: string;
  name: string;
  description: string | null;
  sort: number;
  subject: string;
};

export type QType = "mcq" | "numeric" | "short" | "flashcard" | "math" | "sketch";

export type Question = {
  id: string;
  topic_id: string;
  qtype: QType;
  prompt: string;
  choices: string[] | null;
  answer: string;
  answer_unit: string | null;
  tolerance_pct: number | null;
  sig_figs: number | null;
  explanation: string | null;
  hint: string | null;
  difficulty: number;
  source: string;
  active: boolean;
  subject: string;
  /** Math questions: grading kind and extras (see lib/mathgrade.ts). */
  meta: QuestionMeta | null;
  /** Optional graph to draw with the prompt (see components/GraphView.tsx). */
  graph: GraphSpec | null;
  calc: "calc" | "no-calc" | null;
};

export type AnswerKind = "number" | "expr" | "interval" | "set" | "point" | "equation" | "text";

export type QuestionMeta = {
  kind?: AnswerKind;
  /** Other accepted answers (same kind). */
  accept?: string[];
  /** LaTeX for showing the answer nicely. */
  answer_tex?: string;
  /** Sample domain for expression checks, e.g. [0, 10] for sqrt answers. */
  domain?: [number, number];
  /** MCQ with graph choices: choice label -> graph. */
  choice_graphs?: Record<string, GraphSpec>;
  /** Sketch questions: Desmos expressions for the reference graph, and the self-check list. */
  desmos?: string[];
  checklist?: string[];
  /** Required answer form on top of equivalence: factored product, vertex form, or scientific notation. */
  form?: "factored" | "vertex" | "sci";
  /** Placeholder shown in the answer box. */
  placeholder?: string;
};

export type GraphCurve = {
  /** Function of x in mathjs syntax, drawn over [from, to] (defaults to the window). */
  fn?: string;
  from?: number;
  to?: number;
  /** Or explicit points (polyline, optionally smoothed). */
  points?: [number, number][];
  smooth?: boolean;
  /** Arrowheads show the curve keeps going. */
  arrows?: "start" | "end" | "both";
  color?: string;
  dashed?: boolean;
};

export type GraphSpec = {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  step?: number;
  curves: GraphCurve[];
  dots?: { x: number; y: number; open?: boolean }[];
  asymptotes?: { x?: number; y?: number }[];
  labels?: boolean;
};

export type AgendaItem = {
  id: string;
  date: string;
  text: string;
  kind: string;
  topic_id: string | null;
  subject: string;
  source: string;
  url: string | null;
};
