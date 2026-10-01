import type { Metadata } from "next";
import s from "@/app/subpage.module.css";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { ServiceCta, ServiceItems, ServiceMore } from "@/components/Services/Services";
import card from "@/components/Services/Services.module.css";
import { siteTypePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { pageMetadata, withName } from "@/lib/seo";
import p from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { site, pages } = await getContent();
  return pageMetadata({ site, title: withName(pages.services.seoTitle, site), description: pages.services.seoDescription, path: "/services" });
}

/** Услуги подробно. Короткая версия — блок «Что мы делаем» на главной; данные — в админке, раздел «Услуги». */
export default async function ServicesPage() {
  const { services, siteTypes, pages, blocks } = await getContent();
  const t = pages.services;
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="services" />
      <main className={s.main}>
        <Room id="services" room="services" breadcrumbs={[{ label: t.title, href: "/services" }]} title={t.title} lead={t.lead}>
          <div className={p.list}>
            {services.map((service, i) => (
              // Якорь — на обёртке: у карточки при появлении сдвиг, и прокрутка к ней недотягивала бы до места
              <section key={service.id} id={service.id} className={p.anchor} aria-labelledby={`${service.id}-title`}>
                <article className={`${card.card} ${p.service}`} data-reveal data-press>
                  <span className={card.num} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className={p.summary}>
                    <h2 id={`${service.id}-title`} className={card.title}>
                      {service.title}
                    </h2>
                    <p className={card.audience}>
                      <em>{service.audience}</em>
                    </p>
                    <ServiceItems service={service} />
                    {service.showSiteTypes && (
                      <nav className={p.types} aria-label="Типы сайтов">
                        <PageLink href="/sites" className={p.type}>
                          {t.allTypes}
                        </PageLink>
                        {siteTypes.map((type) => (
                          <PageLink key={type.id} href={siteTypePath(type.id)} className={p.type}>
                            {type.title}
                          </PageLink>
                        ))}
                      </nav>
                    )}
                    <p className={p.price}>
                      {t.priceLabel} <strong>{service.price}</strong>
                    </p>
                    <div className={card.actions}>
                      <ServiceCta service={service} onHome={false} />
                      <ServiceMore service={service} label={blocks.services.moreLabel} />
                    </div>
                  </div>
                  <div className={p.includes}>
                    <h3 className={p.includesTitle}>{t.includesTitle}</h3>
                    <ol className={p.steps}>
                      {service.includes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </div>
                </article>
              </section>
            ))}
          </div>

          <p className="cta-line" data-reveal>
            <span>{t.ctaText}</span>
            <PageLink href="/cases" className="btn btn--outline">
              {t.casesButton}
            </PageLink>
            <a href="#contact" data-lead="new" className="btn btn--primary">
              {t.discussButton}
            </a>
          </p>
        </Room>
      </main>
      <Footer page="services" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
