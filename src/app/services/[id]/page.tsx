import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqList } from "@/components/Faq/FaqList";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { ServiceCta } from "@/components/Services/Services";
import { servicePath, services } from "@/config/services";
import { plans, site } from "@/config/site";
import { siteTypePath, siteTypes } from "@/config/siteTypes";
import s from "../../subpage.module.css";
import p from "../../detail.module.css";

interface Props {
  params: Promise<{ id: string }>;
}

/** Страницы собираются заранее (статический экспорт) — только для услуг из services. */
export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((service) => ({ id: service.id }));
}

const findService = (id: string) => services.find((service) => service.id === id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = findService((await params).id);
  if (!service) return {};
  const title = `${service.title} — ${site.name}`;
  const url = servicePath(service.id);
  return {
    title,
    description: service.summary,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "ru_RU", siteName: site.name, title, description: service.summary, url },
  };
}

/** Услуга подробно: что даёт, когда нужна, что входит, как проходит работа. Данные — src/config/services.ts. */
export default async function ServicePage({ params }: Props) {
  const service = findService((await params).id);
  if (!service) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="services" />
      <main className={s.main}>
        <Room
          id="service"
          room="services"
          breadcrumbs={[
            { label: "Услуги", href: "/services" },
            { label: service.title, href: servicePath(service.id) },
          ]}
          title={service.title}
          lead={service.summary}
        >
          <div className={p.offer} data-reveal>
            <p className={p.price}>
              {service.price}
              <span className={p.term}>{service.audience}</span>
            </p>
            <div className={p.actions}>
              <ServiceCta service={service} onHome={false} primary />
            </div>
          </div>

          <h2 className={p.heading} data-reveal>
            Что это даёт
          </h2>
          <ul className={p.purpose}>
            {service.benefits.map((item, i) => (
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
              <h2 className={p.heading}>Когда это нужно</h2>
              <ul className={p.list}>
                {service.signs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div data-reveal>
              <h2 className={p.heading}>Что входит</h2>
              <ul className={`${p.list} ${p.checks}`}>
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {service.id === "new-site" && (
            <>
              <h2 className={p.heading} data-reveal>
                Какой сайт вам нужен
              </h2>
              <nav className={`${p.others} ${p.types}`} aria-label="Типы сайтов" data-reveal>
                {siteTypes.map((t) => (
                  <PageLink key={t.id} href={siteTypePath(t.id)} className={p.chip}>
                    {plans[t.id].title}
                  </PageLink>
                ))}
                <PageLink href="/site-architecture" className={`${p.chip} ${p.chipAll}`}>
                  Сравнить типы сайтов
                </PageLink>
              </nav>
            </>
          )}

          <h2 className={p.heading} data-reveal>
            Как проходит работа
          </h2>
          <ol className={p.process}>
            {service.process.map((step) => (
              <li key={step.title} data-reveal>
                <h3 className={p.cardTitle}>{step.title}</h3>
                <p className={p.cardText}>{step.text}</p>
              </li>
            ))}
          </ol>

          <h2 className={p.heading} data-reveal>
            Частые вопросы
          </h2>
          <div className={p.faq}>
            <FaqList items={service.faq} />
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

          <nav className={p.others} aria-label="Другие услуги" data-reveal>
            <PageLink href="/services" className={`${p.chip} ${p.chipAll}`}>
              Все услуги
            </PageLink>
            {services
              .filter((other) => other.id !== service.id)
              .map((other) => (
                <PageLink key={other.id} href={servicePath(other.id)} className={p.chip}>
                  {other.title}
                </PageLink>
              ))}
          </nav>

          <p className="cta-line" data-reveal>
            <span>Не уверены, что нужна именно эта услуга? Расскажите о задаче, и мы подскажем, с чего начать.</span>
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
