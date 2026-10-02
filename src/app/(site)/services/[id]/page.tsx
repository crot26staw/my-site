import type { Metadata } from "next";
import { notFound } from "next/navigation";
import p from "@/app/detail.module.css";
import s from "@/app/subpage.module.css";
import { FaqList } from "@/components/Faq/FaqList";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { PageLink } from "@/components/PageLink";
import { Room } from "@/components/Room/Room";
import { ServiceCta } from "@/components/Services/Services";
import { servicePath, siteTypePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { faqJsonLd, JsonLd, pageMetadata, serviceJsonLd, withName } from "@/lib/seo";

interface Props {
  params: Promise<{ id: string }>;
}

async function findService(id: string) {
  return (await getContent()).services.find((service) => service.id === id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await findService((await params).id);
  if (!service) return {};
  const { site } = await getContent();
  return pageMetadata({ site, title: withName(service.seo.title, site), description: service.seo.description, path: servicePath(service.id) });
}

/** «от 30 000 ₽» → 30000; плейсхолдер «[от N ₽]» — без цены в разметке. */
const minPrice = (price: string) => (/^от\s[\d\s]+₽$/.test(price) ? Number(price.replace(/\D/g, "")) : undefined);

/** Услуга подробно: что даёт, когда нужна, что входит, как проходит работа. Данные — в админке, раздел «Услуги». */
export default async function ServicePage({ params }: Props) {
  const service = await findService((await params).id);
  if (!service) notFound();
  const { site, region, services, siteTypes, pages } = await getContent();
  const t = pages.service;

  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="services" />
      <main className={s.main}>
        <Room
          id="service"
          room="services"
          breadcrumbs={[
            { label: pages.services.title, href: "/services" },
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
            {t.benefitsTitle}
          </h2>
          <ul className={p.purpose}>
            {service.benefits.map((item, i) => (
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
              <h2 className={p.heading}>{t.signsTitle}</h2>
              <ul className={p.list}>
                {service.signs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div data-reveal>
              <h2 className={p.heading}>{t.includesTitle}</h2>
              <ul className={`${p.list} ${p.checks}`}>
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {service.showSiteTypes && (
            <>
              <h2 className={p.heading} data-reveal>
                {t.typesTitle}
              </h2>
              <nav className={`${p.others} ${p.types}`} aria-label="Типы сайтов" data-reveal>
                {siteTypes.map((type) => (
                  <PageLink key={type.id} href={siteTypePath(type.id)} className={p.chip}>
                    {type.title}
                  </PageLink>
                ))}
                <PageLink href="/sites" className={`${p.chip} ${p.chipAll}`}>
                  {t.compareTypes}
                </PageLink>
              </nav>
            </>
          )}

          <h2 className={p.heading} data-reveal>
            {t.processTitle}
          </h2>
          <ol className={p.process}>
            {service.process.map((step, i) => (
              <li key={i} data-reveal>
                <h3 className={p.cardTitle}>{step.title}</h3>
                <p className={p.cardText}>{step.text}</p>
              </li>
            ))}
          </ol>

          {service.faq.length > 0 && (
            <>
              <h2 className={p.heading} data-reveal>
                {t.faqTitle}
              </h2>
              <div className={p.faq}>
                <FaqList items={service.faq} />
              </div>
              <JsonLd data={faqJsonLd(service.faq)} />
            </>
          )}
          <JsonLd
            data={serviceJsonLd({
              site,
              region,
              name: service.title,
              description: service.seo.description,
              path: servicePath(service.id),
              minPrice: minPrice(service.price),
            })}
          />

          <nav className={p.others} aria-label="Другие услуги" data-reveal>
            <PageLink href="/services" className={`${p.chip} ${p.chipAll}`}>
              {t.allServices}
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
