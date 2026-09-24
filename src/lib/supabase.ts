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
};

export type QType = "mcq" | "numeric" | "short" | "flashcard";

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
};

export type AgendaItem = {
  id: string;
  date: string;
  text: string;
  kind: string;
  topic_id: string | null;
};
