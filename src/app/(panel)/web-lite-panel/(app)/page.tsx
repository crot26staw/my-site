import type { Metadata } from "next";
import Link from "next/link";
import { getSection } from "@/content/sections";
import { PANEL_PATH } from "@/lib/paths";
import { requireUser } from "@/lib/server/auth";
import { query, queryOne } from "@/lib/server/db";
import { LEAD_SOURCES, LEAD_STATUSES } from "./leads/labels";

export const metadata: Metadata = { title: "Обзор" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Moscow" });

export default async function Dashboard() {
  const user = await requireUser();
  const counts = await queryOne<{ new: number; in_progress: number; week: number }>(
    `SELECT count(*) FILTER (WHERE status = 'new')::int AS new,
            count(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
            count(*) FILTER (WHERE created_at > now() - interval '7 days' AND status <> 'spam')::int AS week
     FROM leads`,
  );
  const leads = await query<{ id: string; source: string; name: string | null; contact: string; status: string; created_at: Date }>(
    "SELECT id, source, name, contact, status, created_at FROM leads ORDER BY id DESC LIMIT 5",
  );
  const changes = await query<{ key: string; created_at: Date; author: string | null; version: number }>(
    `SELECT r.key, r.created_at, u.name AS author, r.version FROM content_revisions r
     LEFT JOIN users u ON u.id = r.created_by WHERE r.created_by IS NOT NULL ORDER BY r.id DESC LIMIT 6`,
  );

  return (
    <>
      <h1>Здравствуйте, {user.name}!</h1>
      <p className="lead-text">Здесь заявки с сайта и все тексты, цены и картинки. Изменения появляются на сайте сразу после сохранения.</p>

      <div className="grid" style={{ marginBottom: "1.25rem" }}>
        <Link href={`${PANEL_PATH}/leads?status=new`} className="card stat">
          <strong>{counts?.new ?? 0}</strong>
          <span>новых заявок</span>
        </Link>
        <Link href={`${PANEL_PATH}/leads?status=in_progress`} className="card stat">
          <strong>{counts?.in_progress ?? 0}</strong>
          <span>в работе</span>
        </Link>
        <Link href={`${PANEL_PATH}/leads?status=all`} className="card stat">
          <strong>{counts?.week ?? 0}</strong>
          <span>заявок за 7 дней</span>
        </Link>
      </div>

      <section className="card">
        <h2>Последние заявки</h2>
        {leads.length === 0 ? (
          <p className="muted">Заявок пока нет. Они появятся здесь, когда посетители заполнят форму или квиз.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`${PANEL_PATH}/leads/${l.id}`}>№{l.id}</Link>
                    </td>
                    <td>{LEAD_SOURCES[l.source] ?? l.source}</td>
                    <td>{l.name ?? "—"}</td>
                    <td>{l.contact}</td>
                    <td>
                      <span className={`status status-${l.status}`}>{LEAD_STATUSES[l.status]}</span>
                    </td>
                    <td className="muted">{dateFormat.format(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Последние изменения контента</h2>
        {changes.length === 0 ? (
          <p className="muted">Через админку ещё ничего не меняли. Выберите раздел в меню слева.</p>
        ) : (
          <ul>
            {changes.map((c, i) => (
              <li key={i}>
                <Link href={`${PANEL_PATH}/content/${c.key}`}>{getSection(c.key)?.title ?? c.key}</Link>{" "}
                <span className="muted">
                  — {c.author ?? "—"}, {dateFormat.format(c.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
