import { site } from "@/config/site";
import { PageLink } from "../PageLink";
import s from "./Breadcrumbs.module.css";

/** Звено цепочки. Последнее — текущая страница: показывается текстом, href нужен для разметки. */
export interface Crumb {
  label: string;
  href: string;
}

const HOME: Crumb = { label: "Главная", href: "/" };

/** Хлебные крошки отдельных страниц («Главная» добавляется сама) + разметка BreadcrumbList для поиска. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail = [HOME, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.label,
      item: new URL(crumb.href, site.url).href,
    })),
  };

  return (
    <nav className={s.nav} aria-label="Хлебные крошки">
      <ol className={s.list}>
        {trail.map((crumb, i) => (
          <li key={crumb.href} className={s.item}>
            {i < trail.length - 1 ? (
              <PageLink href={crumb.href} className={s.link}>
                {crumb.label}
              </PageLink>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
