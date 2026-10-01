import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { PANEL_PATH } from "@/lib/paths";
import { query, queryOne } from "./db";
import { DUMMY_HASH, verifyPassword } from "./password";
import { clientIpHash, userAgent } from "./request";
import { decryptSecret } from "./secrets";
import { SESSION_COOKIE } from "./sessionCookie";
import { verifyTotp } from "./totp";

/**
 * Вход в админку и сессии.
 * - В cookie — случайный токен 256 бит; в базе — только его SHA-256.
 * - Сессия гаснет через 2 часа бездействия и в любом случае через 12 часов.
 * - Смена пароля завершает все сессии пользователя.
 * - Перебор паролей: не больше 5 неудачных попыток на логин и 20 на IP за 15 минут.
 */

export type Role = "admin" | "editor";

export interface CurrentUser {
  id: number;
  login: string;
  name: string;
  role: Role;
  totpEnabled: boolean;
  sessionId: string;
}

const IDLE_MS = 2 * 60 * 60 * 1000;
const ABSOLUTE_MS = 12 * 60 * 60 * 1000;
const LOCK_WINDOW_MINUTES = 15;
const MAX_FAILS_PER_LOGIN = 5;
const MAX_FAILS_PER_IP = 20;

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Текущий пользователь по cookie сессии или null. Один запрос к базе на запрос страницы. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const id = tokenHash(token);
  const row = await queryOne<{
    user_id: number;
    login: string;
    name: string;
    role: Role;
    totp_enabled: boolean;
    last_seen_at: Date;
  }>(
    `SELECT s.user_id, u.login, u.name, u.role, u.totp_enabled, s.last_seen_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now() AND s.last_seen_at > now() - make_interval(secs => $2)
       AND u.is_active AND s.created_at >= u.password_changed_at`,
    [id, IDLE_MS / 1000],
  );
  if (!row) return null;
  // Продлеваем бездействие не чаще раза в минуту
  if (Date.now() - row.last_seen_at.getTime() > 60_000) {
    await query("UPDATE sessions SET last_seen_at = now() WHERE id = $1", [id]);
  }
  return { id: row.user_id, login: row.login, name: row.name, role: row.role, totpEnabled: row.totp_enabled, sessionId: id };
});

/** Для страниц и действий админки: без входа — на страницу входа, без нужной роли — на главную админки. */
export async function requireUser(role?: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`${PANEL_PATH}/login`);
  if (role === "admin" && user.role !== "admin") redirect(PANEL_PATH);
  return user;
}

export type LoginResult = { ok: true } | { ok: false; error: string; needCode?: boolean };

const GENERIC_ERROR = "Неверный логин или пароль";

export async function login(loginInput: string, password: string, code: string): Promise<LoginResult> {
  const login = loginInput.trim().toLowerCase().slice(0, 64);
  const ipHash = await clientIpHash();
  if (!login || !password || password.length > 256) return { ok: false, error: GENERIC_ERROR };

  const fails = await queryOne<{ by_login: number; by_ip: number }>(
    `SELECT count(*) FILTER (WHERE login = $1)::int AS by_login, count(*) FILTER (WHERE ip_hash = $2)::int AS by_ip
     FROM login_attempts WHERE NOT success AND created_at > now() - make_interval(mins => $3)`,
    [login, ipHash, LOCK_WINDOW_MINUTES],
  );
  if ((fails?.by_login ?? 0) >= MAX_FAILS_PER_LOGIN || (fails?.by_ip ?? 0) >= MAX_FAILS_PER_IP) {
    return { ok: false, error: `Слишком много неудачных попыток. Подождите ${LOCK_WINDOW_MINUTES} минут и попробуйте снова.` };
  }

  const user = await queryOne<{
    id: number;
    password_hash: string;
    is_active: boolean;
    totp_enabled: boolean;
    totp_secret: string | null;
    totp_last_step: string;
  }>("SELECT id, password_hash, is_active, totp_enabled, totp_secret, totp_last_step FROM users WHERE login = $1", [login]);

  // Пароль проверяем и для несуществующего логина: время ответа не выдаёт, есть ли такой пользователь
  const passwordOk = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  const recordFail = () => query("INSERT INTO login_attempts (ip_hash, login, success) VALUES ($1, $2, false)", [ipHash, login]);

  if (!user || !passwordOk || !user.is_active) {
    await recordFail();
    return { ok: false, error: GENERIC_ERROR };
  }

  if (user.totp_enabled && user.totp_secret) {
    const cleanCode = code.replace(/\s/g, "");
    if (!cleanCode) return { ok: false, error: "Введите код из приложения", needCode: true };
    const step = verifyTotp(decryptSecret(user.totp_secret), cleanCode, Number(user.totp_last_step));
    if (step === null) {
      await recordFail();
      return { ok: false, error: "Неверный код. Проверьте время на телефоне и введите новый код.", needCode: true };
    }
    // Запоминаем шаг: тот же код повторно не примем
    await query("UPDATE users SET totp_last_step = $2 WHERE id = $1", [user.id, step]);
  }

  await query("INSERT INTO login_attempts (ip_hash, login, success) VALUES ($1, $2, true)", [ipHash, login]);
  await createSession(user.id);
  await query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);
  await audit(user.id, "login");
  return { ok: true };
}

async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO sessions (id, user_id, expires_at, ip_hash, user_agent) VALUES ($1, $2, now() + make_interval(secs => $3), $4, $5)",
    [tokenHash(token), userId, ABSOLUTE_MS / 1000, await clientIpHash(), await userAgent()],
  );
  // Чистим просроченное заодно — без отдельного планировщика
  await query("DELETE FROM sessions WHERE expires_at < now() OR last_seen_at < now() - make_interval(secs => $1)", [IDLE_MS / 1000]);
  await query("DELETE FROM login_attempts WHERE created_at < now() - interval '30 days'");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_MS / 1000,
  });
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) {
    await query("DELETE FROM sessions WHERE id = $1", [user.sessionId]);
    await audit(user.id, "logout");
  }
  (await cookies()).delete(SESSION_COOKIE);
}

/** Завершить все сессии пользователя, кроме текущей (после смены пароля или по кнопке). */
export async function endOtherSessions(userId: number, keepSessionId?: string) {
  await query("DELETE FROM sessions WHERE user_id = $1 AND id <> coalesce($2, '')", [userId, keepSessionId ?? null]);
}

/** Запись в журнал действий. */
export async function audit(userId: number | null, action: string, target?: string, details?: Record<string, unknown>) {
  await query("INSERT INTO audit_log (user_id, action, target, details, ip_hash) VALUES ($1, $2, $3, $4, $5)", [
    userId,
    action,
    target ?? null,
    details ? JSON.stringify(details) : null,
    await clientIpHash(),
  ]);
}
