"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PANEL_PATH } from "@/lib/paths";
import { audit, requireUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

const STATUSES = new Set(["new", "in_progress", "done", "spam"]);

export interface LeadFormState {
  ok?: boolean;
  error?: string;
}

export async function updateLeadAction(_prev: LeadFormState, form: FormData): Promise<LeadFormState> {
  const user = await requireUser();
  const id = Number(form.get("id"));
  const status = String(form.get("status") ?? "");
  const note = String(form.get("note") ?? "").replace(/\r\n?/g, "\n").trim();
  if (!Number.isInteger(id) || id < 1) return { error: "Заявка не найдена" };
  if (!STATUSES.has(status)) return { error: "Неизвестный статус" };
  if (note.length > 5000) return { error: "Заметка — не больше 5000 символов" };
  const rows = await query("UPDATE leads SET status = $2, note = $3, updated_at = now() WHERE id = $1 RETURNING id", [id, status, note]);
  if (!rows.length) return { error: "Заявка не найдена" };
  await audit(user.id, "lead.update", String(id), { status });
  revalidatePath(`${PANEL_PATH}/leads`);
  return { ok: true };
}

/** Удаление заявки — по запросу человека (152-ФЗ: отзыв согласия). Только администратор. */
export async function deleteLeadAction(form: FormData) {
  const user = await requireUser("admin");
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id < 1) return;
  await query("DELETE FROM leads WHERE id = $1", [id]);
  await audit(user.id, "lead.delete", String(id));
  redirect(`${PANEL_PATH}/leads`);
}
