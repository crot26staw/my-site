import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLeadAction } from "@/actions/panel/leads";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { PANEL_PATH } from "@/lib/paths";
import { requireUser } from "@/lib/server/auth";
import { queryOne } from "@/lib/server/db";
import { LEAD_CHANNELS, LEAD_SOURCES } from "../labels";
import { LeadEditForm } from "./LeadEditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Заявка №${(await params).id}` };
}

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Moscow" });

export default async function LeadPage({ params }: Props) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const lead = await queryOne<{
    id: string;
    source: string;
    place: string | null;
    name: string | null;
    contact: string;
    channel: string | null;
    url: string | null;
    task: string | null;
    answers: Record<string, string[]> | null;
    price_min: number | null;
    price_max: number | null;
    status: string;
    note: string;
    created_at: Date;
  }>("SELECT * FROM leads WHERE id = $1", [id]);
  if (!lead) notFound();

  return (
    <>
      <p>
        <Link href={`${PANEL_PATH}/leads`}>← Все заявки</Link>
      </p>
      <h1>Заявка №{lead.id}</h1>

      <section className="card">
        <dl className="props">
          <dt>Когда</dt>
          <dd>{dateFormat.format(lead.created_at)} (МСК)</dd>
          <dt>Откуда</dt>
          <dd>
            {LEAD_SOURCES[lead.source] ?? lead.source}
            {lead.place === "modal" ? " (окно заявки)" : lead.place === "contact" ? " (блок «Контакты»)" : ""}
          </dd>
          {lead.name && (
            <>
              <dt>Имя</dt>
              <dd>{lead.name}</dd>
            </>
          )}
          <dt>Контакт</dt>
          <dd>
            {lead.contact}
            {lead.channel && ` — ${LEAD_CHANNELS[lead.channel]}`}
          </dd>
          {lead.url && (
            <>
              <dt>Сайт</dt>
              {/* Ссылку из заявки не делаем кликабельной: адрес вводил посетитель */}
              <dd>{lead.url}</dd>
            </>
          )}
          {lead.task && (
            <>
              <dt>Задача</dt>
              <dd>{lead.task}</dd>
            </>
          )}
          {lead.price_min !== null && (
            <>
              <dt>Расчёт квиза</dt>
              <dd>
                {lead.price_min.toLocaleString("ru-RU")} – {lead.price_max?.toLocaleString("ru-RU")} ₽
              </dd>
            </>
          )}
          {lead.answers &&
            Object.entries(lead.answers).map(([q, a]) => (
              <div key={q} style={{ display: "contents" }}>
                <dt>{q}</dt>
                <dd>{a.length ? a.join(", ") : "—"}</dd>
              </div>
            ))}
        </dl>
      </section>

      <section className="card">
        <h2>Работа с заявкой</h2>
        <LeadEditForm id={id} status={lead.status} note={lead.note} />
      </section>

      {user.role === "admin" && (
        <section className="card">
          <h2>Удаление</h2>
          <p className="muted">Удаляйте заявку, если человек попросил удалить его данные. Восстановить её будет нельзя.</p>
          <form action={deleteLeadAction}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton message={`Удалить заявку №${id} навсегда?`} className="btn btn-danger">
              Удалить заявку
            </ConfirmButton>
          </form>
        </section>
      )}
    </>
  );
}
