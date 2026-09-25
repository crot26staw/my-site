import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink, SectionLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { fromPrice, plans, site } from "@/config/site";
import { siteTypePath, siteTypes } from "@/config/siteTypes";
import s from "../../subpage.module.css";
import p from "../../detail.module.css";

interface Props {
  params: Promise<{ type: string }>;
}

/** Страницы собираются заранее (статический экспорт) — только для типов из siteTypes. */
export const dynamicParams = false;

export function generateStaticParams() {
  return siteTypes.map((t) => ({ type: t.id }));
}

const findType = (id: string) => siteTypes.find((t) => t.id === id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const type = findType((await params).type);
  if (!type) return {};
  const title = `${plans[type.id].title} под ключ — ${site.name}`;
  const url = siteTypePath(type.id);
  return {
    title,
    description: type.summary,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "ru_RU", siteName: site.name, title, description: type.summary, url },
  };
}

/** Тип сайта подробно: для чего нужен, кому подходит, что входит. Данные — src/config/siteTypes.ts. */
export default async function SiteTypePage({ params }: Props) {
  const type = findType((await params).type);
  if (!type) notFound();
  const plan = plans[type.id];
  const name = plan.title.charAt(0).toLowerCase() + plan.title.slice(1);

  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="site-architecture" />
      <main className={s.main}>
        <Room
          id="site-type"
          room="pricing"
          breadcrumbs={[
            { label: "Типы сайтов и цены", href: "/site-architecture" },
            { label: plan.title, href: siteTypePath(type.id) },
          ]}
          title={plan.title}
          lead={type.summary}
        >
          <div className={p.offer} data-reveal>
            <p className={p.price}>
              {fromPrice(plan.price)}
              <span className={p.term}>срок {plan.term}</span>
            </p>
            <div className={p.actions}>
              <a href="#contact" data-lead="new" className="btn btn--primary">
                {type.cta}
              </a>
              <SectionLink id="quiz" onHome={false} data-quiz data-plan={type.id} className="btn btn--outline">
                Рассчитать стоимость
              </SectionLink>
            </div>
          </div>

          <h2 className={p.heading} data-reveal>
            Для чего нужен {name}
          </h2>
          <ul className={p.purpose}>
            {type.purpose.map((item, i) => (
              <li key={item.title} className={p.card} data-reveal data-press>
                <span className={p.num} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={p.cardTitle}>{item.title}</h3>
                <p className={p.cardText}>{item.text}</p>
              </li>
            ))}
          </ul>

          <div className={p.columns}>
            <div data-reveal>
              <h2 className={p.heading}>Кому подходит</h2>
              <ul className={p.list}>
                {type.audience.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div data-reveal>
              <h2 className={p.heading}>Что входит</h2>
              <ul className={`${p.list} ${p.checks}`}>
                {type.features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className={p.heading} data-reveal>
            Когда лучше выбрать другое
          </h2>
          <ul className={p.alternatives}>
            {type.alternatives.map((alt) => (
              <li key={alt.id} data-reveal>
                <span>{alt.when}</span>
                <PageLink href={siteTypePath(alt.id)} className={p.altLink}>
                  {plans[alt.id].title} <span aria-hidden="true">→</span>
                </PageLink>
              </li>
            ))}
          </ul>

          <nav className={p.others} aria-label="Другие типы сайтов" data-reveal>
            <PageLink href="/site-architecture" className={`${p.chip} ${p.chipAll}`}>
              Все типы сайтов
            </PageLink>
            {siteTypes
              .filter((t) => t.id !== type.id)
              .map((t) => (
                <PageLink key={t.id} href={siteTypePath(t.id)} className={p.chip}>
                  {plans[t.id].title}
                </PageLink>
              ))}
          </nav>

          <p className="cta-line" data-reveal>
            <span>Не уверены, что {name} — то, что нужно? Расскажите о задаче, и мы подскажем, с чего начать.</span>
            <PageLink href="/cases" className="btn btn--outline">
              Наши работы
            </PageLink>
            <a href="#contact" data-lead="new" className="btn btn--primary">
              Обсудить проект
            </a>
          </p>
        </Room>
      </main>
      <Footer page="site-architecture" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
