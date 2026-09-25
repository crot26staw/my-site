import type { Metadata } from "next";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { ServiceCta, ServiceItems, ServiceMore } from "@/components/Services/Services";
import card from "@/components/Services/Services.module.css";
import { services } from "@/config/services";
import { plans, site } from "@/config/site";
import { siteTypePath, siteTypes } from "@/config/siteTypes";
import s from "../subpage.module.css";
import p from "./page.module.css";

const title = `Услуги — ${site.name}`;
const description =
  "Создание сайтов с нуля, аудит и редизайн, переезд на новую CMS, SEO-продвижение. Что входит в каждую услугу и сколько она стоит.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/services" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.name,
    title,
    description,
    url: "/services",
  },
};

/** Услуги подробно. Короткая версия — блок «Что мы делаем» на главной; данные — src/config/services.ts. */
export default function ServicesPage() {
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="services" />
      <main className={s.main}>
        <Room
          id="services"
          room="services"
          breadcrumbs={[{ label: "Услуги", href: "/services" }]}
          title="Что мы делаем"
          lead="Берём на себя весь цикл работы над сайтом: от идеи и дизайна до продвижения в поиске. Можно заказать проект под ключ или отдельную услугу."
        >
          <div className={p.list}>
            {services.map((service, i) => (
              // Якорь — на обёртке: у карточки при появлении сдвиг, и прокрутка к ней недотягивала бы до места
              <section
                key={service.id}
                id={service.id}
                className={p.anchor}
                aria-labelledby={`${service.id}-title`}
              >
                <article
                  className={`${card.card} ${p.service}`}
                  data-reveal
                  data-press
                >
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
                  {service.id === "new-site" && (
                    <nav className={p.types} aria-label="Типы сайтов">
                      <PageLink href="/site-architecture" className={p.type}>
                        Все типы сайтов
                      </PageLink>
                      {siteTypes.map((t) => (
                        <PageLink key={t.id} href={siteTypePath(t.id)} className={p.type}>
                          {plans[t.id].title}
                        </PageLink>
                      ))}
                    </nav>
                  )}
                    <p className={p.price}>
                      Стоимость: <strong>{service.price}</strong>
                    </p>
                    <div className={card.actions}>
                      <ServiceCta service={service} onHome={false} />
                      <ServiceMore service={service} />
                    </div>
                  </div>
                  <div className={p.includes}>
                    <h3 className={p.includesTitle}>Что входит</h3>
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
            <span>
              Посмотрите, что получилось у клиентов, которые уже работали с
              нами.
            </span>
            <PageLink href="/cases" className="btn btn--outline">
              Наши работы
            </PageLink>
            <a href="#contact" data-lead="new" className="btn btn--primary">
              Обсудить проект
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
