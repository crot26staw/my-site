import type { Service } from "@/content/types";
import { servicePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { PageLink, SectionLink } from "../PageLink";
import { Room } from "../Room/Room";
import s from "./Services.module.css";

export async function Services() {
  const { services, blocks } = await getContent();
  const t = blocks.services;
  return (
    <Room id="services" room="services" index="03" title={t.title} lead={t.lead}>
      <div className={s.grid}>
        {services.map((service, i) => (
          <article key={service.id} className={s.card} data-reveal data-press>
            <span className={s.num} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={s.title}>{service.title}</h3>
            <p className={s.audience}>
              <em>{service.audience}</em>
            </p>
            <ServiceItems service={service} />
            <div className={s.actions}>
              <ServiceCta service={service} onHome />
              <ServiceMore service={service} label={t.moreLabel} />
            </div>
          </article>
        ))}

        <NicheCard title={t.nicheTitle} text={t.nicheText} cta={t.nicheCta} />
      </div>

      <p className={`cta-line ${s.allLine}`} data-reveal>
        <span>{t.allText}</span>
        <PageLink href="/services" className="btn btn--outline">
          {t.allButton}
        </PageLink>
      </p>
    </Room>
  );
}

export function ServiceItems({ service }: { service: Service }) {
  return (
    <ul className={s.items}>
      {service.items.map((item) => (
        <li key={item.name}>
          <strong>{item.name}:</strong> {item.text}
        </li>
      ))}
    </ul>
  );
}

/** Кнопка услуги: модалка заявки (href="#contact" — запасной путь без JS) или переход к блоку главной. */
export function ServiceCta({
  service: { cta },
  onHome,
  primary = false,
}: {
  service: Service;
  onHome: boolean;
  /** Залитая кнопка — главное действие (на странице услуги). */
  primary?: boolean;
}) {
  const className = `btn ${primary ? "btn--primary" : "btn--outline"} ${s.cta}`;
  if (cta.lead) {
    return (
      <a href="#contact" data-lead={cta.lead} className={className}>
        {cta.label}
      </a>
    );
  }
  return (
    <SectionLink id={cta.section} onHome={onHome} data-quiz={cta.section === "quiz" || undefined} className={className}>
      {cta.label}
    </SectionLink>
  );
}

/** Ссылка на страницу услуги /services/<id>. */
export function ServiceMore({ service, label }: { service: Service; label: string }) {
  return (
    <PageLink href={servicePath(service.id)} className={s.more}>
      {label} <span aria-hidden="true">→</span>
    </PageLink>
  );
}

function NicheCard({ title, text, cta }: { title: string; text: string; cta: string }) {
  return (
    <article className={`${s.card} ${s.wide}`} data-reveal data-press>
      <div className={s.wideText}>
        <h3 className={s.title}>{title}</h3>
        <p className={s.wideLead}>{text}</p>
      </div>
      <a href="#contact" data-lead="new" className={`btn btn--primary ${s.cta}`}>
        {cta}
      </a>
    </article>
  );
}
