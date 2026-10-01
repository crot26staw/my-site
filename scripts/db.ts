/**
 * Обслуживание базы из консоли (Node 22.18+ запускает TypeScript сам):
 *   npm run db:migrate             — применить новые миграции из db/migrations
 *   npm run db:seed                — заполнить пустые разделы контента текстами по умолчанию (content/*.json)
 *   npm run admin:create           — создать пользователя админки (спросит логин, имя, роль и пароль)
 *   npm run admin:reset-password   — задать пользователю новый пароль (все его сессии завершатся)
 *   npm run admin:reset-2fa        — отключить пользователю двухфакторную авторизацию (потерял телефон)
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import pg from "pg";
import { checkNewPassword, hashPassword } from "../src/lib/server/password.ts";

const ROOT = join(import.meta.dirname, "..");

try {
  process.loadEnvFile(join(ROOT, ".env"));
} catch {
  // .env нет — переменные заданы окружением (systemd, docker)
}

const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL не задан (см. .env.example)");

const client = new pg.Client({ connectionString: url });

const commands: Record<string, () => Promise<void>> = {
  migrate,
  seed,
  "create-admin": createAdmin,
  "reset-password": resetPassword,
  "reset-2fa": resetTwoFactor,
};

const command = commands[process.argv[2] ?? ""];
if (!command) fail(`Команды: ${Object.keys(commands).join(", ")}`);

await client.connect();
try {
  await command();
} finally {
  await client.end();
}

async function migrate() {
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const applied = new Set((await client.query<{ version: string }>("SELECT version FROM schema_migrations")).rows.map((r) => r.version));
  const files = (await readdir(join(ROOT, "db/migrations"))).filter((f) => f.endsWith(".sql")).sort();
  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(ROOT, "db/migrations", file), "utf8");
    // Миграция целиком или никак
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`✓ ${file}`);
      count++;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }
  console.log(count ? `Применено миграций: ${count}` : "Новых миграций нет");
}

async function seed() {
  const dir = join(ROOT, "content");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  let count = 0;
  for (const file of files) {
    const key = file.replace(/\.json$/, "");
    const data = JSON.parse(await readFile(join(dir, file), "utf8"));
    const res = await client.query("INSERT INTO content (key, data) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", [key, JSON.stringify(data)]);
    if (res.rowCount) {
      console.log(`✓ ${key}`);
      count++;
    }
  }
  console.log(count ? `Добавлено разделов: ${count}` : "Все разделы уже есть в базе — ничего не изменено");
}

async function createAdmin() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const login = (await rl.question("Логин (латиница, цифры, . _ -): ")).trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(login)) fail("Логин: 3–32 символа, латиница, цифры, точка, дефис, подчёркивание");
  const name = (await rl.question("Имя (как показывать в админке): ")).trim() || login;
  const roleAnswer = (await rl.question("Роль — admin (всё, включая пользователей) или editor (контент и заявки) [admin]: ")).trim();
  const role = roleAnswer || "admin";
  if (role !== "admin" && role !== "editor") fail("Роль: admin или editor");
  rl.close();
  const password = await askPassword(login);
  const res = await client.query(
    "INSERT INTO users (login, name, role, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (login) DO NOTHING",
    [login, name.slice(0, 80), role, await hashPassword(password)],
  );
  if (!res.rowCount) fail(`Пользователь ${login} уже есть. Сменить пароль: npm run admin:reset-password`);
  console.log(`✓ Пользователь ${login} (${role}) создан. Вход: /web-lite-panel`);
}

async function resetPassword() {
  const login = await askLogin();
  const password = await askPassword(login);
  const res = await client.query(
    "UPDATE users SET password_hash = $2, password_changed_at = now() WHERE login = $1 RETURNING id",
    [login, await hashPassword(password)],
  );
  if (!res.rowCount) fail(`Пользователя ${login} нет`);
  await client.query("DELETE FROM sessions WHERE user_id = $1", [res.rows[0].id]);
  // Снимаем блокировку входа после неудачных попыток
  await client.query("DELETE FROM login_attempts WHERE login = $1 AND NOT success", [login]);
  console.log(`✓ Пароль ${login} изменён, все сессии завершены`);
}

async function resetTwoFactor() {
  const login = await askLogin();
  const res = await client.query(
    "UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_last_step = 0 WHERE login = $1 RETURNING id",
    [login],
  );
  if (!res.rowCount) fail(`Пользователя ${login} нет`);
  await client.query("DELETE FROM sessions WHERE user_id = $1", [res.rows[0].id]);
  console.log(`✓ Двухфакторная авторизация для ${login} отключена. Включите её заново в админке: «Мой профиль».`);
}

async function askLogin(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const login = (await rl.question("Логин: ")).trim().toLowerCase();
  rl.close();
  return login;
}

async function askPassword(login: string): Promise<string> {
  const password = await readHidden(`Пароль (не короче 10 символов): `);
  const error = checkNewPassword(password, login);
  if (error) fail(error);
  if ((await readHidden("Повторите пароль: ")) !== password) fail("Пароли не совпадают");
  return password;
}

/** Ввод без отображения символов. */
function readHidden(prompt: string): Promise<string> {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) fail("Запустите команду в интерактивном терминале");
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolve) => {
    let value = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}
