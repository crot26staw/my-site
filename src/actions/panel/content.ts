"use server";

import { getSection } from "@/content/sections";
import type { ValidationError } from "@/content/schema";
import { audit, requireUser } from "@/lib/server/auth";
import { writeSection } from "@/lib/server/content";
import { queryOne } from "@/lib/server/db";

export type SaveSectionResult =
  | { ok: true; version: number; data: unknown }
  | { ok: false; errors?: ValidationError[]; conflict?: boolean; error?: string };

/** Сохранить раздел. Данные проверяются по схеме раздела на сервере — что бы ни прислал браузер. */
export async function saveSectionAction(key: string, data: unknown, version: number): Promise<SaveSectionResult> {
  const user = await requireUser();
  if (typeof key !== "string" || !getSection(key)) return { ok: false, error: "Неизвестный раздел" };
  if (!Number.isInteger(version) || version < 0) return { ok: false, error: "Некорректная версия" };
  const result = await writeSection(key, data, version, user.id);
  if (!result.ok) {
    if ("conflict" in result) return { ok: false, conflict: true };
    return { ok: false, errors: result.errors };
  }
  await audit(user.id, "content.save", key, { version: result.version });
  return { ok: true, version: result.version, data: result.data };
}

/** Вернуть прошлую версию раздела. Восстановление само становится новой версией — его тоже можно откатить. */
export async function restoreRevisionAction(key: string, revisionId: number, version: number): Promise<SaveSectionResult> {
  const user = await requireUser();
  if (!getSection(key) || !Number.isInteger(revisionId)) return { ok: false, error: "Неизвестная версия" };
  const revision = await queryOne<{ data: unknown; version: number }>("SELECT data, version FROM content_revisions WHERE id = $1 AND key = $2", [
    revisionId,
    key,
  ]);
  if (!revision) return { ok: false, error: "Версия не найдена" };
  const result = await writeSection(key, revision.data, version, user.id, `Восстановлена версия ${revision.version}`);
  if (!result.ok) {
    if ("conflict" in result) return { ok: false, conflict: true };
    // Старая версия может не пройти новые правила проверки
    return { ok: false, error: "Эта версия не проходит текущую проверку полей — восстановите вручную" };
  }
  await audit(user.id, "content.restore", key, { from: revision.version, version: result.version });
  return { ok: true, version: result.version, data: result.data };
}
