"use server";

import { revalidatePath } from "next/cache";
import { PANEL_PATH } from "@/lib/paths";
import { audit, requireUser, type Role } from "@/lib/server/auth";
import { query, queryOne } from "@/lib/server/db";
import { checkNewPassword, hashPassword } from "@/lib/server/password";

export interface UserFormState {
  ok?: string;
  error?: string;
}

const LOGIN = /^[a-z0-9._-]{3,32}$/;
const ROLES = new Set<Role>(["admin", "editor"]);

const cleanName = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, "")
    .trim()
    .slice(0, 80);

/** Сколько активных администраторов останется, если изменить пользователя id. */
async function adminsLeftWithout(id: number): Promise<number> {
  const row = await queryOne<{ n: number }>("SELECT count(*)::int AS n FROM users WHERE role = 'admin' AND is_active AND id <> $1", [id]);
  return row?.n ?? 0;
}

export async function createUserAction(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const me = await requireUser("admin");
  const login = String(form.get("login") ?? "").trim().toLowerCase();
  const name = cleanName(form.get("name")) || login;
  const role = String(form.get("role") ?? "") as Role;
  const password = String(form.get("password") ?? "");
  if (!LOGIN.test(login)) return { error: "Логин: 3–32 символа — латинские буквы, цифры, точка, дефис, подчёркивание" };
  if (!ROLES.has(role)) return { error: "Выберите роль" };
  const passwordError = checkNewPassword(password, login);
  if (passwordError) return { error: passwordError };
  const rows = await query("INSERT INTO users (login, name, role, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (login) DO NOTHING RETURNING id", [
    login,
    name,
    role,
    await hashPassword(password),
  ]);
  if (!rows.length) return { error: `Логин «${login}» уже занят` };
  await audit(me.id, "user.create", login, { role });
  revalidatePath(`${PANEL_PATH}/users`);
  return { ok: `Пользователь ${login} создан. Передайте ему пароль лично и попросите сменить его в «Моём профиле».` };
}

export async function updateUserAction(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const me = await requireUser("admin");
  const id = Number(form.get("id"));
  const name = cleanName(form.get("name"));
  const role = String(form.get("role") ?? "") as Role;
  const active = form.get("active") === "on";
  if (!Number.isInteger(id)) return { error: "Пользователь не найден" };
  if (!name) return { error: "Укажите имя" };
  if (!ROLES.has(role)) return { error: "Выберите роль" };
  if ((role !== "admin" || !active) && (await adminsLeftWithout(id)) === 0) {
    return { error: "Нельзя оставить админку без активного администратора" };
  }
  const rows = await query("UPDATE users SET name = $2, role = $3, is_active = $4 WHERE id = $1 RETURNING login", [id, name, role, active]);
  if (!rows.length) return { error: "Пользователь не найден" };
  if (!active) await query("DELETE FROM sessions WHERE user_id = $1", [id]);
  await audit(me.id, "user.update", String(id), { role, active });
  revalidatePath(`${PANEL_PATH}/users`);
  return { ok: "Сохранено" };
}

export async function resetUserPasswordAction(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const me = await requireUser("admin");
  const id = Number(form.get("id"));
  const password = String(form.get("password") ?? "");
  const user = await queryOne<{ login: string }>("SELECT login FROM users WHERE id = $1", [id]);
  if (!user) return { error: "Пользователь не найден" };
  const passwordError = checkNewPassword(password, user.login);
  if (passwordError) return { error: passwordError };
  await query("UPDATE users SET password_hash = $2, password_changed_at = now() WHERE id = $1", [id, await hashPassword(password)]);
  // Все сессии пользователя завершаются; если это я сам — войду заново
  await query("DELETE FROM sessions WHERE user_id = $1", [id]);
  await query("DELETE FROM login_attempts WHERE login = $1 AND NOT success", [user.login]);
  await audit(me.id, "user.reset_password", String(id));
  return { ok: "Пароль изменён, все сессии пользователя завершены" };
}

export async function resetUserTwoFactorAction(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const me = await requireUser("admin");
  const id = Number(form.get("id"));
  const rows = await query("UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_last_step = 0 WHERE id = $1 RETURNING id", [id]);
  if (!rows.length) return { error: "Пользователь не найден" };
  await audit(me.id, "user.reset_2fa", String(id));
  revalidatePath(`${PANEL_PATH}/users`);
  return { ok: "Двухфакторная авторизация отключена" };
}

export async function deleteUserAction(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const me = await requireUser("admin");
  const id = Number(form.get("id"));
  if (id === me.id) return { error: "Нельзя удалить самого себя" };
  if ((await adminsLeftWithout(id)) === 0) return { error: "Нельзя удалить последнего администратора" };
  const rows = await query<{ login: string }>("DELETE FROM users WHERE id = $1 RETURNING login", [id]);
  if (!rows.length) return { error: "Пользователь не найден" };
  await audit(me.id, "user.delete", rows[0].login);
  revalidatePath(`${PANEL_PATH}/users`);
  return { ok: `Пользователь ${rows[0].login} удалён` };
}
