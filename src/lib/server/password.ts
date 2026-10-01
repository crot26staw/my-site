/**
 * Хеширование паролей: scrypt с параметрами OWASP (N=2^17, r=8, p=1), своя соль на каждый пароль.
 * Без зависимостей и без "server-only": модуль используют и сайт, и консольные скрипты (scripts/db.ts).
 * Формат: scrypt$<log2 N>$<r>$<p>$<соль base64>$<хеш base64> — параметры можно усилить, старые хеши продолжат работать.
 */

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const LOG_N = 17;
const R = 8;
const P = 1;
const KEY_LEN = 64;
// 128 * N * r байт на один хеш + запас
const MAX_MEM = 256 * 1024 * 1024;

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

function derive(password: string, salt: Buffer, logN: number, r: number, p: number): Promise<Buffer> {
  const options: ScryptOptions = { N: 2 ** logN, r, p, maxmem: MAX_MEM };
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LEN, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

// Хеширование занимает ~128 МБ памяти: считаем по одному, чтобы волна попыток входа не съела память сервера
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export function hashPassword(password: string): Promise<string> {
  return serial(async () => {
    const salt = randomBytes(16);
    const key = await derive(password, salt, LOG_N, R, P);
    return `scrypt$${LOG_N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  return serial(async () => {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [logN, r, p] = parts.slice(1, 4).map(Number);
    if (![logN, r, p].every(Number.isInteger) || logN < 14 || logN > 20) return false;
    const expected = Buffer.from(parts[5], "base64");
    const key = await derive(password, Buffer.from(parts[4], "base64"), logN, r, p);
    return key.length === expected.length && timingSafeEqual(key, expected);
  });
}

/** Хеш, с которым сверяем пароль, когда пользователя нет: время ответа не выдаёт, существует ли логин. */
export const DUMMY_HASH = "scrypt$17$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

/** Проверка нового пароля. Возвращает текст ошибки или null. */
export function checkNewPassword(password: string, login?: string): string | null {
  if (password.length < PASSWORD_MIN) return `Пароль должен быть не короче ${PASSWORD_MIN} символов`;
  if (password.length > PASSWORD_MAX) return `Пароль должен быть не длиннее ${PASSWORD_MAX} символов`;
  if (/^(.)\1+$/.test(password)) return "Пароль из одного повторяющегося символа слишком простой";
  if (login && password.toLowerCase().includes(login.toLowerCase())) return "Пароль не должен содержать логин";
  const lower = password.toLowerCase();
  if (COMMON.some((w) => lower.includes(w)) && new Set(lower).size < 8) return "Пароль слишком простой";
  return null;
}

const COMMON = ["password", "qwerty", "123456", "admin", "пароль", "йцукен", "111111", "web-lite", "weblite"];
