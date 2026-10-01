import { absoluteUrl, JsonLd } from "@/lib/seo";
import { PageLink } from "../PageLink";
import s from "./Breadcrumbs.module.css";

/** Звено цепочки. Последнее — текущая страница: показывается текстом, href нужен для разметки. */
export interface Crumb {
  label: string;
  href: string;
}

const HOME: Crumb = { label: "Главная", href: "/" };

/**
 * Хлебные крошки отдельных страниц («Главная» добавляется сама) + разметка BreadcrumbList для поиска.
 * renderLink — своя ссылка вместо перехода на страницу (в модалке кейса: звено страницы под модалкой закрывает её).
 * jsonLd: false — без разметки (страница, у которой своя главная цепочка: список кейсов под открытым кейсом).
 */
export function Breadcrumbs({
  items,
  renderLink,
  jsonLd: withJsonLd = true,
  siteUrl,
}: {
  items: Crumb[];
  /** Адрес сайта для разметки: https://<домен>. */
  siteUrl: string;
  renderLink?: (crumb: Crumb, className: string) => React.ReactNode | undefined;
  jsonLd?: boolean;
}) {
  const trail = [HOME, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: absoluteUrl(siteUrl, crumb.href),
    })),
  };

  return (
    <nav className={s.nav} aria-label="Хлебные крошки">
      <ol className={s.list}>
        {trail.map((crumb, i) => (
          <li key={crumb.href} className={s.item}>
            {i < trail.length - 1 ? (
              (renderLink?.(crumb, s.link) ?? (
                <PageLink href={crumb.href} className={s.link}>
                  {crumb.label}
                </PageLink>
              ))
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
      {withJsonLd && <JsonLd data={jsonLd} />}
    </nav>
  );
}
