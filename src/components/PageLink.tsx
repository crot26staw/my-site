import Link from "next/link";

/** Страницы сайта: шапка и футер подсвечивают текущую и строят ссылки на блоки главной. */
export type SitePage = "home" | "services" | "cases" | "site-architecture" | "faq";

type AnchorProps = Omit<React.ComponentProps<"a">, "href">;

/**
 * Ссылка на другую страницу сайта. Next добавляет к href базовый путь (GitHub Pages),
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
