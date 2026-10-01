import type { Metadata } from "next";
import type { SiteSettings } from "@/content/types";

/** Адрес сайта без «/» в конце: https://<домен>. */
export const siteUrlOf = (site: Pick<SiteSettings, "url">) => site.url.replace(/\/$/, "");

/** "/cases" → "https://<домен>/cases" — для разметки schema.org, sitemap и robots. */
export const absoluteUrl = (base: string, path: string) => `${base}${path === "/" ? "/" : path}`;

/** Плейсхолдер вида «[Телефон]» или ссылка без ника — значит, данные ещё не заполнены. */
export const isFilled = (value: string) => !value.includes("[") && !/\/$/.test(value);

/**
 * Метаданные страницы: title, description, canonical, Open Graph и превью для Twitter/X.
 * path — адрес страницы от корня сайта; image — своя картинка превью (иначе общая public/og.png).
 */
export function pageMetadata({
  site,
  title,
  description,
  path,
  type = "website",
  image,
}: {
  site: Pick<SiteSettings, "name">;
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
}): Metadata {
  const images = image ? [{ url: image, alt: title }] : [{ url: "/og.png", width: 1200, height: 630, alt: `${site.name} — сайты под ключ` }];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, locale: "ru_RU", siteName: site.name, title, description, url: path, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** Заголовок страницы с названием сайта в конце. */
export const withName = (title: string, site: Pick<SiteSettings, "name">) => `${title} — ${site.name}`;

/** Разметка главной: организация (контакты появятся, когда их заполнят в админке) и сам сайт. */
export function organizationJsonLd(site: SiteSettings, description: string) {
  const base = siteUrlOf(site);
  const { contacts } = site;
  const sameAs = [contacts.telegramUrl, contacts.whatsappUrl].filter(isFilled);
  const orgId = absoluteUrl(base, "/#organization");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: site.name,
        url: absoluteUrl(base, "/"),
        description,
        areaServed: { "@type": "Country", name: "Россия" },
        ...(isFilled(contacts.phone) && { telephone: contacts.phone }),
        ...(isFilled(contacts.email) && { email: contacts.email }),
        ...(sameAs.length > 0 && { sameAs }),
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl(base, "/#website"),
        name: site.name,
        url: absoluteUrl(base, "/"),
        inLanguage: "ru",
        publisher: { "@id": orgId },
      },
    ],
  };
}

/** Разметка услуги или типа сайта: что продаём, кто делает и цена «от». */
export function serviceJsonLd({
  site,
  name,
  description,
  path,
  minPrice,
}: {
  site: Pick<SiteSettings, "url">;
  name: string;
  description: string;
  path: string;
  /** Цена «от» в рублях; без неё — разметка без предложения. */
  minPrice?: number;
}) {
  const base = siteUrlOf(site);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: absoluteUrl(base, path),
    provider: { "@id": absoluteUrl(base, "/#organization") },
    areaServed: { "@type": "Country", name: "Россия" },
    ...(minPrice !== undefined && {
      offers: {
        "@type": "Offer",
        priceCurrency: "RUB",
        priceSpecification: { "@type": "PriceSpecification", minPrice, priceCurrency: "RUB" },
        url: absoluteUrl(base, path),
      },
    }),
  };
}

/** Разметка FAQPage. */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/**
 * <script type="application/ld+json"> с разметкой. Тексты приходят из админки, поэтому «<» экранируем:
 * иначе строка с «</script>» закрыла бы тег и дальше выполнилась как HTML (XSS).
 */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
