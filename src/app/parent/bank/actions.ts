"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";

export async function toggleQuestion(formData: FormData) {
  const s = await getSession();
  if (!s || s.role !== "parent") redirect("/study");
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "1";
  const topic = String(formData.get("topic") ?? "");
  await db().from("chem_questions").update({ active }).eq("id", id);
  redirect(`/parent/bank?topic=${encodeURIComponent(topic)}`);
}
