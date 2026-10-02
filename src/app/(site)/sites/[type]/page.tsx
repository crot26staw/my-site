import type { Metadata } from "next";
import { notFound } from "next/navigation";
import p from "@/app/detail.module.css";
import s from "@/app/subpage.module.css";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink, SectionLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { fill } from "@/content/schema";
import { fromPrice, lowerFirst, plansOf } from "@/lib/format";
import { siteTypePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { JsonLd, pageMetadata, serviceJsonLd } from "@/lib/seo";

interface Props {
  params: Promise<{ type: string }>;
}

async function findType(id: string) {
  return (await getContent()).siteTypes.find((t) => t.id === id);
}

/** Переменные этой страницы: {тип} — «лендинг», {цена} — «от 30 000 ₽». */
const pageVars = (title: string, price: number) => ({ тип: lowerFirst(title), цена: fromPrice(price) });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const type = await findType((await params).type);
  if (!type) return {};
  const { site, pages } = await getContent();
  return pageMetadata({
    site,
    title: fill(pages.siteType.seoTitle, pageVars(type.title, type.price)),
    description: pages.siteType.seoDescription ? fill(pages.siteType.seoDescription, pageVars(type.title, type.price)) : type.summary,
    path: siteTypePath(type.id),
  });
}

/** Тип сайта подробно: для чего нужен, кому подходит, что входит. Данные — в админке, раздел «Типы сайтов и цены». */
export default async function SiteTypePage({ params }: Props) {
  const type = await findType((await params).type);
  if (!type) notFound();
  const { site, region, siteTypes, pages } = await getContent();
  const plans = plansOf(siteTypes);
  const plan = plans[type.id];
  const vars = pageVars(plan.title, plan.price);
  const t = pages.siteType;

  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="sites" />
      <main className={s.main}>
        <Room
          id="site-type"
          room="pricing"
          breadcrumbs={[
            { label: pages.sites.title, href: "/sites" },
            { label: plan.title, href: siteTypePath(type.id) },
          ]}
          title={plan.title}
          lead={type.summary}
        >
          <div className={p.offer} data-reveal>
            <p className={p.price}>
              {fromPrice(plan.price)}
              <span className={p.term}>
                {t.termPrefix} {plan.term}
              </span>
            </p>
            <div className={p.actions}>
              <a href="#contact" data-lead="new" className="btn btn--primary">
                {type.cta}
              </a>
              <SectionLink id="quiz" onHome={false} data-quiz data-plan={type.id} className="btn btn--outline">
                {t.calcButton}
              </SectionLink>
            </div>
          </div>

          <h2 className={p.heading} data-reveal>
            {fill(t.purposeTitle, vars)}
          </h2>
          <ul className={p.purpose}>
            {type.purpose.map((item, i) => (
              <li key={i} className={p.card} data-reveal data-press>
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
              <h2 className={p.heading}>{t.audienceTitle}</h2>
              <ul className={p.list}>
                {type.audience.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div data-reveal>
              <h2 className={p.heading}>{t.featuresTitle}</h2>
              <ul className={`${p.list} ${p.checks}`}>
                {type.features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {type.alternatives.length > 0 && (
            <>
              <h2 className={p.heading} data-reveal>
                {t.alternativesTitle}
              </h2>
              <ul className={p.alternatives}>
                {type.alternatives.map((alt, i) => (
                  <li key={i} data-reveal>
                    <span>{alt.when}</span>
                    <PageLink href={siteTypePath(alt.id)} className={p.altLink}>
                      {plans[alt.id].title} <span aria-hidden="true">→</span>
                    </PageLink>
                  </li>
                ))}
              </ul>
            </>
          )}

          <JsonLd
            data={serviceJsonLd({
              site,
              region,
              name: `${plan.title} под ключ`,
              description: type.summary,
              path: siteTypePath(type.id),
              minPrice: plan.price,
            })}
          />

          <nav className={p.others} aria-label="Другие типы сайтов" data-reveal>
            <PageLink href="/sites" className={`${p.chip} ${p.chipAll}`}>
              {t.allTypes}
            </PageLink>
            {siteTypes
              .filter((other) => other.id !== type.id)
              .map((other) => (
                <PageLink key={other.id} href={siteTypePath(other.id)} className={p.chip}>
                  {plans[other.id].title}
                </PageLink>
              ))}
          </nav>

          <p className="cta-line" data-reveal>
            <span>{fill(t.ctaText, vars)}</span>
            <PageLink href="/cases" className="btn btn--outline">
              {t.casesButton}
            </PageLink>
            <a href="#contact" data-lead="new" className="btn btn--primary">
              {t.discussButton}
            </a>
          </p>
        </Room>
      </main>
      <Footer page="sites" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
