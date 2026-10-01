import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { ChangePasswordForm, SessionsBlock, TwoFactorBlock } from "./AccountForms";

export const metadata: Metadata = { title: "Мой профиль" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Moscow" });

export default async function AccountPage() {
  const me = await requireUser();
  const sessions = await query<{ id: string; created_at: Date; last_seen_at: Date; user_agent: string | null }>(
    "SELECT id, created_at, last_seen_at, user_agent FROM sessions WHERE user_id = $1 AND expires_at > now() ORDER BY last_seen_at DESC",
    [me.id],
  );

  return (
    <>
      <h1>Мой профиль</h1>
      <p className="lead-text">
        {me.name} ({me.login}), {me.role === "admin" ? "администратор" : "редактор"}.
      </p>

      <section className="card">
        <h2>Пароль</h2>
        <ChangePasswordForm />
      </section>

      <section className="card">
        <h2>Двухфакторная авторизация</h2>
        <p className="muted">
          Кроме пароля, при входе нужен будет код из приложения на телефоне. Даже если пароль узнают, без телефона войти не получится.
        </p>
        <TwoFactorBlock enabled={me.totpEnabled} />
      </section>

      <section className="card">
        <h2>Где выполнен вход</h2>
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              {describeAgent(s.user_agent)} — активность {dateFormat.format(s.last_seen_at)}
              {s.id === me.sessionId && <strong> (это устройство)</strong>}
            </li>
          ))}
        </ul>
        {sessions.length > 1 && <SessionsBlock />}
      </section>
    </>
  );
}

function describeAgent(ua: string | null): string {
  if (!ua) return "Неизвестное устройство";
  const browser = /Edg\//.test(ua) ? "Edge" : /YaBrowser/.test(ua) ? "Яндекс Браузер" : /Firefox/.test(ua) ? "Firefox" : /Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Браузер";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser}, ${os}` : browser;
}
