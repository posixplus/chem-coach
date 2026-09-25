"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { isSubject } from "@/lib/subject";

/** Parent adds a quiz/test date by hand (e.g. announced on Schoology). Ingest never deletes these. */
export async function addAgendaItem(fd: FormData) {
  const s = await getSession();
  if (!s || s.role !== "parent") return;
  const subject = String(fd.get("subject") ?? "");
  const date = String(fd.get("date") ?? "");
  const text = String(fd.get("text") ?? "").trim().slice(0, 140);
  const kind = String(fd.get("kind") ?? "other");
  const topicId = String(fd.get("topic_id") ?? "") || null;
  if (!isSubject(subject) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !text) return;
  await db().from("chem_agenda").insert({ subject, date, text, kind: ["quiz", "test", "due", "other"].includes(kind) ? kind : "other", topic_id: topicId, source: "manual" });
  revalidatePath("/parent");
  revalidatePath("/study");
}

export async function deleteAgendaItem(fd: FormData) {
  const s = await getSession();
  if (!s || s.role !== "parent") return;
  const id = String(fd.get("id") ?? "");
  if (id) await db().from("chem_agenda").delete().eq("id", id).eq("source", "manual");
  revalidatePath("/parent");
  revalidatePath("/study");
}
