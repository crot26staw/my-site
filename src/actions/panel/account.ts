"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { PANEL_PATH } from "@/lib/paths";
import { audit, endOtherSessions, requireUser } from "@/lib/server/auth";
import { query, queryOne } from "@/lib/server/db";
import { checkNewPassword, hashPassword, verifyPassword } from "@/lib/server/password";
import { decryptSecret, encryptSecret } from "@/lib/server/secrets";
import { generateTotpSecret, totpUri, verifyTotp } from "@/lib/server/totp";

export interface AccountState {
  ok?: string;
  error?: string;
}

async function checkCurrentPassword(userId: number, password: string): Promise<boolean> {
  const row = await queryOne<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [userId]);
  return !!row && password.length <= 256 && (await verifyPassword(password, row.password_hash));
}

export async function changePasswordAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  const me = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  const repeat = String(form.get("repeat") ?? "");
  if (!(await checkCurrentPassword(me.id, current))) return { error: "Текущий пароль неверный" };
  const error = checkNewPassword(next, me.login);
  if (error) return { error };
  if (next !== repeat) return { error: "Новые пароли не совпадают" };
  if (next === current) return { error: "Новый пароль совпадает с текущим" };
  // Сессии, созданные до смены пароля, перестают действовать. Текущую оставляем (обновляем её время создания),
  // остальные — завершаем: если пароль меняют из-за утечки, чужой вход оборвётся сразу
  await query("UPDATE users SET password_hash = $2, password_changed_at = now() WHERE id = $1", [me.id, await hashPassword(next)]);
  await query("UPDATE sessions SET created_at = now() WHERE id = $1", [me.sessionId]);
  await endOtherSessions(me.id, me.sessionId);
  await audit(me.id, "account.password");
  return { ok: "Пароль изменён. На других устройствах нужно войти заново." };
}

export interface TotpSetup {
  secret: string;
  qrSvg: string;
}

/** Шаг 1: новый секрет и QR-код. Секрет сохраняется зашифрованным, но 2FA включится только после проверки кода. */
export async function startTwoFactorAction(): Promise<TotpSetup | { error: string }> {
  const me = await requireUser();
  if (me.totpEnabled) return { error: "Двухфакторная авторизация уже включена" };
  const secret = generateTotpSecret();
  await query("UPDATE users SET totp_secret = $2, totp_last_step = 0 WHERE id = $1 AND NOT totp_enabled", [me.id, encryptSecret(secret)]);
  const qrSvg = await QRCode.toString(totpUri(secret, me.login, "Web-Lite"), { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return { secret, qrSvg };
}

/** Шаг 2: пользователь вводит код из приложения — значит, приложение настроено, включаем. */
export async function confirmTwoFactorAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  const me = await requireUser();
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const row = await queryOne<{ totp_secret: string | null; totp_enabled: boolean }>("SELECT totp_secret, totp_enabled FROM users WHERE id = $1", [me.id]);
  if (!row?.totp_secret || row.totp_enabled) return { error: "Начните настройку заново" };
  const step = verifyTotp(decryptSecret(row.totp_secret), code);
  if (step === null) return { error: "Код не подошёл. Проверьте, что время на телефоне верное, и введите новый код." };
  await query("UPDATE users SET totp_enabled = true, totp_last_step = $2 WHERE id = $1", [me.id, step]);
  await endOtherSessions(me.id, me.sessionId);
  await audit(me.id, "account.2fa_on");
  revalidatePath(`${PANEL_PATH}/account`);
  return { ok: "Двухфакторная авторизация включена" };
}

export async function disableTwoFactorAction(_prev: AccountState, form: FormData): Promise<AccountState> {
  const me = await requireUser();
  if (!(await checkCurrentPassword(me.id, String(form.get("password") ?? "")))) return { error: "Пароль неверный" };
  await query("UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_last_step = 0 WHERE id = $1", [me.id]);
  await audit(me.id, "account.2fa_off");
  revalidatePath(`${PANEL_PATH}/account`);
  return { ok: "Двухфакторная авторизация отключена" };
}

export async function endOtherSessionsAction(): Promise<AccountState> {
  const me = await requireUser();
  await endOtherSessions(me.id, me.sessionId);
  await audit(me.id, "account.end_sessions");
  revalidatePath(`${PANEL_PATH}/account`);
  return { ok: "Все остальные сессии завершены" };
}
