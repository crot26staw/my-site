import type { Metadata } from "next";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink, SectionLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { fromPrice, plans, site } from "@/config/site";
import { siteTypePath, siteTypes } from "@/config/siteTypes";
import s from "../subpage.module.css";
import p from "./page.module.css";

const title = `Какой сайт нужен вашему бизнесу — ${site.name}`;
const description =
  "Лендинг, корпоративный сайт, каталог, сайт для сервиса или интернет-магазин: для чего нужен каждый тип сайта, кому подходит и сколько стоит.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/site-architecture" },
  openGraph: { type: "website", locale: "ru_RU", siteName: site.name, title, description, url: "/site-architecture" },
};

/** Все типы сайтов коротко, подробно — на /site-architecture/<id>. Данные — src/config/siteTypes.ts. */
export default function SitesPage() {
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="site-architecture" />
      <main className={s.main}>
        <Room
          id="sites"
          room="pricing"
          breadcrumbs={[{ label: "Типы сайтов и цены", href: "/site-architecture" }]}
          title="Какой сайт нужен вашему бизнесу"
          lead="Тип сайта зависит от задачи: быстро получать заявки, рассказать о компании, показать товары или продавать онлайн. Коротко о каждом — ниже, подробности на странице типа."
        >
          <ul className={p.grid}>
            {siteTypes.map((type, i) => {
              const plan = plans[type.id];
              return (
                <li key={type.id} className={p.card} data-reveal data-press data-card-link>
                  <span className={p.num} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className={p.title}>
                    <PageLink href={siteTypePath(type.id)} className={`card-link ${p.link}`}>
                      {plan.title}
                    </PageLink>
                  </h2>
                  <p className={p.price}>
                    {fromPrice(plan.price)}
                    <span className={p.term}>{plan.term}</span>
                  </p>
                  <p className={p.summary}>{type.summary}</p>
                  <h3 className={p.label}>Кому подходит</h3>
                  <ul className={p.audience}>
                    {type.audience.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <span className={p.more} aria-hidden="true">
                    Подробнее <span>→</span>
                  </span>
                </li>
              );
            })}

            {/* Шестая ячейка: пять типов + подсказка — ровная сетка и в 2, и в 3 колонки */}
            <li className={`${p.card} ${p.pick}`} data-reveal>
              <h2 className={p.title}>Не знаете, что выбрать?</h2>
              <p className={p.pickText}>
                Ответьте на 5 вопросов и получите расчёт стоимости. Или расскажите о задаче — подскажем, с чего начать.
              </p>
              <div className={p.pickActions}>
                <SectionLink id="quiz" onHome={false} data-quiz className="btn btn--primary">
                  Пройти тест за 1 минуту
                </SectionLink>
                <a href="#contact" data-lead="new" className="btn btn--outline">
                  Обсудить проект
                </a>
              </div>
            </li>
          </ul>
        </Room>
      </main>
      <Footer page="site-architecture" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
