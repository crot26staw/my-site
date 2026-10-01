import type { Metadata } from "next";
import { getSection } from "@/content/sections";
import { requireUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";

export const metadata: Metadata = { title: "Журнал действий" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "medium", timeZone: "Europe/Moscow" });

const ACTIONS: Record<string, string> = {
  login: "Вход",
  logout: "Выход",
  "content.save": "Изменил раздел",
  "content.restore": "Вернул версию раздела",
  "lead.update": "Изменил заявку",
  "lead.delete": "Удалил заявку",
  "user.create": "Создал пользователя",
  "user.update": "Изменил пользователя",
  "user.delete": "Удалил пользователя",
  "user.reset_password": "Сменил пароль пользователю",
  "user.reset_2fa": "Сбросил 2FA пользователю",
  "account.password": "Сменил свой пароль",
  "account.2fa_on": "Включил 2FA",
  "account.2fa_off": "Отключил 2FA",
  "account.end_sessions": "Завершил другие сессии",
  upload: "Загрузил картинку",
};

export default async function JournalPage() {
  await requireUser("admin");
  const rows = await query<{ id: string; action: string; target: string | null; created_at: Date; name: string | null }>(
    `SELECT a.id, a.action, a.target, a.created_at, u.name FROM audit_log a
     LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 300`,
  );
  const failed = await query<{ n: number }>(
    "SELECT count(*)::int AS n FROM login_attempts WHERE NOT success AND created_at > now() - interval '24 hours'",
  );

  return (
    <>
      <h1>Журнал действий</h1>
      <p className="lead-text">Последние 300 действий в админке. Неудачных попыток входа за сутки: {failed[0]?.n ?? 0}.</p>
      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Когда</th>
                <th>Кто</th>
                <th>Что</th>
                <th>Объект</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="muted">{dateFormat.format(r.created_at)}</td>
                  <td>{r.name ?? "—"}</td>
                  <td>{ACTIONS[r.action] ?? r.action}</td>
                  <td>{(r.action.startsWith("content.") && r.target && getSection(r.target)?.title) || r.target || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
