import type { Metadata } from "next";
import s from "@/app/subpage.module.css";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink, SectionLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { fromPrice, plansOf } from "@/lib/format";
import { siteTypePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { pageMetadata, withName } from "@/lib/seo";
import p from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { site, pages } = await getContent();
  return pageMetadata({ site, title: withName(pages.sites.seoTitle, site), description: pages.sites.seoDescription, path: "/sites" });
}

/** Все типы сайтов коротко, подробно — на /sites/<id>. Данные — в админке, раздел «Типы сайтов и цены». */
export default async function SitesPage() {
  const { siteTypes, pages } = await getContent();
  const t = pages.sites;
  const plans = plansOf(siteTypes);
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="sites" />
      <main className={s.main}>
        <Room id="sites" room="pricing" breadcrumbs={[{ label: t.title, href: "/sites" }]} title={t.title} lead={t.lead}>
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
                  <h3 className={p.label}>{t.audienceTitle}</h3>
                  <ul className={p.audience}>
                    {type.audience.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <span className={p.more} aria-hidden="true">
                    {t.moreLabel} <span>→</span>
                  </span>
                </li>
              );
            })}

            {/* Шестая ячейка: пять типов + подсказка — ровная сетка и в 2, и в 3 колонки */}
            <li className={`${p.card} ${p.pick}`} data-reveal>
              <h2 className={p.title}>{t.pickTitle}</h2>
              <p className={p.pickText}>{t.pickText}</p>
              <div className={p.pickActions}>
                <SectionLink id="quiz" onHome={false} data-quiz className="btn btn--primary">
                  {t.pickQuiz}
                </SectionLink>
                <a href="#contact" data-lead="new" className="btn btn--outline">
                  {t.pickDiscuss}
                </a>
              </div>
            </li>
          </ul>
        </Room>
      </main>
      <Footer page="sites" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
