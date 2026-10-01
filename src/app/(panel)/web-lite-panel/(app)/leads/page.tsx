import type { Metadata } from "next";
import Link from "next/link";
import { PANEL_PATH } from "@/lib/paths";
import { requireUser } from "@/lib/server/auth";
import { query, queryOne } from "@/lib/server/db";
import { LEAD_CHANNELS, LEAD_SOURCES, LEAD_STATUSES } from "./labels";

export const metadata: Metadata = { title: "Заявки" };

const PAGE_SIZE = 50;
const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Moscow" });

interface Props {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

export default async function LeadsPage({ searchParams }: Props) {
  await requireUser();
  const params = await searchParams;
  const status = params.status && (params.status === "all" || params.status in LEAD_STATUSES) ? params.status : "active";
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(1000, Number(params.page) || 1));

  // Фильтры — только параметрами запроса, текст поиска экранируется для LIKE
  const where: string[] = [];
  const args: unknown[] = [];
  if (status === "active") where.push("status IN ('new', 'in_progress')");
  else if (status !== "all") {
    args.push(status);
    where.push(`status = $${args.length}`);
  }
  if (q) {
    args.push(`%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    where.push(`(contact ILIKE $${args.length} OR name ILIKE $${args.length} OR url ILIKE $${args.length} OR task ILIKE $${args.length})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (await queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM leads ${whereSql}`, args))?.n ?? 0;
  const leads = await query<{
    id: string;
    source: string;
    name: string | null;
    contact: string;
    channel: string | null;
    status: string;
    price_min: number | null;
    created_at: Date;
  }>(
    `SELECT id, source, name, contact, channel, status, price_min, created_at FROM leads ${whereSql}
     ORDER BY id DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    args,
  );
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (next: { status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    sp.set("status", next.status ?? status);
    if (q) sp.set("q", q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    return `${PANEL_PATH}/leads?${sp}`;
  };

  const tabs = [
    { id: "active", label: "Новые и в работе" },
    ...Object.entries(LEAD_STATUSES).map(([id, label]) => ({ id, label })),
    { id: "all", label: "Все" },
  ];

  return (
    <>
      <h1>Заявки</h1>
      <p className="lead-text">Заявки с форм и квиза. Откройте заявку, чтобы сменить статус или оставить заметку.</p>

      <nav className="tabs" aria-label="Статус">
        {tabs.map((t) => (
          <Link key={t.id} href={link({ status: t.id })} className="tab" aria-current={t.id === status ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      <form className="actions" style={{ marginBottom: "1rem" }}>
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={q} className="input" placeholder="Поиск: имя, телефон, ник, сайт" style={{ maxWidth: "24rem" }} maxLength={100} />
        <button type="submit" className="btn">
          Найти
        </button>
        {q && (
          <Link href={link({})} className="btn">
            Сбросить
          </Link>
        )}
      </form>

      <section className="card">
        {leads.length === 0 ? (
          <p className="muted">Заявок нет.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Когда</th>
                  <th>Откуда</th>
                  <th>Имя</th>
                  <th>Контакт</th>
                  <th>Расчёт</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`${PANEL_PATH}/leads/${l.id}`}>№{l.id}</Link>
                    </td>
                    <td className="muted">{dateFormat.format(l.created_at)}</td>
                    <td>{LEAD_SOURCES[l.source] ?? l.source}</td>
                    <td>{l.name ?? "—"}</td>
                    <td>
                      {l.contact}
                      {l.channel && <div className="small muted">{LEAD_CHANNELS[l.channel]}</div>}
                    </td>
                    <td>{l.price_min ? `от ${l.price_min.toLocaleString("ru-RU")} ₽` : "—"}</td>
                    <td>
                      <span className={`status status-${l.status}`}>{LEAD_STATUSES[l.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="actions" style={{ marginTop: "1rem" }}>
            {page > 1 && (
              <Link href={link({ page: page - 1 })} className="btn btn-sm">
                ← Назад
              </Link>
            )}
            <span className="muted">
              Страница {page} из {pages}
            </span>
            {page < pages && (
              <Link href={link({ page: page + 1 })} className="btn btn-sm">
                Дальше →
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );
}
