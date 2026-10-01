import Link from "next/link";

/** Страницы сайта: шапка и футер подсвечивают текущую и строят ссылки на блоки главной. */
/** legal — политика и согласие: в меню их нет, ничего не подсвечивается. */
export type SitePage = "home" | "services" | "cases" | "sites" | "faq" | "legal";

type AnchorProps = Omit<React.ComponentProps<"a">, "href">;

/**
 * Ссылка на другую страницу сайта. Next добавляет к href базовый путь,
 * а PageTransition по data-page-link перехватывает клик и проигрывает анимацию перехода.
 */
export function PageLink({ href, ...rest }: AnchorProps & { href: string }) {
  return <Link href={href} data-page-link={href} {...rest} />;
}

/**
 * Ссылка на блок главной. На главной — обычный якорь (плавно прокручивает ScrollDirector),
 * на остальных страницах — переход на главную сразу к блоку.
 */
export function SectionLink({ id, onHome, ...rest }: AnchorProps & { id: string; onHome: boolean }) {
  return onHome ? <a href={`#${id}`} {...rest} /> : <PageLink href={`/#${id}`} {...rest} />;
}

/**
 * Ссылка из админки: страница сайта ("/sites/landing"), модалка заявки ("#lead-new", "#lead-audit")
 * или квиз ("#quiz"). Модалки открываются по data-lead / data-quiz, href — запасной путь без JS.
 */
export function TargetLink({ target, onHome = true, ...rest }: AnchorProps & { target: string; onHome?: boolean }) {
  if (target === "#lead-new" || target === "#lead-audit") {
    return <a href="#contact" data-lead={target === "#lead-audit" ? "audit" : "new"} {...rest} />;
  }
  if (target === "#quiz") return <SectionLink id="quiz" onHome={onHome} data-quiz {...rest} />;
  return <PageLink href={target} {...rest} />;
}
