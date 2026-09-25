import { legal, site } from "@/config/site";
import { TelegramIcon, WhatsAppIcon } from "../icons";
import { PageLink, SectionLink, type SitePage } from "../PageLink";
import s from "./Footer.module.css";

const nav: { label: string; section?: string; page?: SitePage }[] = [
  { page: "services", label: "Услуги" },
  { page: "site-architecture", label: "Типы сайтов и цены" },
  { page: "cases", label: "Кейсы" },
  { section: "process", label: "Как мы работаем" },
  { page: "faq", label: "FAQ" },
];

// Типы сайтов — на свои страницы (src/config/siteTypes.ts), остальное — на страницы услуг (src/config/services.ts).
const services = [
  { label: "Лендинги", href: "/site-architecture/landing" },
  { label: "Корпоративные сайты", href: "/site-architecture/corporate" },
  { label: "Каталоги и интернет-магазины", href: "/site-architecture/shop" },
  { label: "Аудит и редизайн", href: "/services/improve" },
  { label: "Перенос на новую CMS", href: "/services/migration" },
  { label: "SEO-продвижение", href: "/services/seo" },
];

/** На отдельных страницах (page ≠ home) нет 3D-двери за футером — отступ сверху как в обычном режиме. */
export function Footer({ page = "home" }: { page?: SitePage }) {
  const { contacts } = site;
  const onHome = page === "home";
  return (
    <footer className={onHome ? s.footer : `${s.footer} ${s.plain}`}>
      <div className={s.inner}>
        <div className={s.grid}>
          <div className={s.col}>
            {onHome ? (
              <a href="#top" className={s.logo}>
                {site.logo}
              </a>
            ) : (
              <PageLink href="/" className={s.logo}>
                {site.logo}
              </PageLink>
            )}
            <p className={s.about}>Сайты под ключ быстрее и дешевле. Разработка, дизайн и SEO с использованием AI-инструментов.</p>
          </div>

          <nav className={s.col} aria-label="Навигация в подвале">
            <h2 className={s.heading}>Навигация</h2>
            <ul className={s.list}>
              {nav.map((item) => (
                <li key={item.label}>
                  {item.page ? (
                    <PageLink href={`/${item.page}`} aria-current={item.page === page ? "page" : undefined}>
                      {item.label}
                    </PageLink>
                  ) : (
                    <SectionLink id={item.section!} onHome={onHome}>
                      {item.label}
                    </SectionLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className={s.col}>
            <h2 className={s.heading}>Услуги</h2>
            <ul className={s.list}>
              {services.map((item) => (
                <li key={item.label}>
                  <PageLink href={item.href}>{item.label}</PageLink>
                </li>
              ))}
            </ul>
          </div>

          <div className={s.col}>
            <h2 className={s.heading}>Контакты</h2>
            <ul className={s.list}>
              <li>
                <a href={contacts.phoneHref} className={s.phone}>
                  {contacts.phone}
                </a>
              </li>
              <li>
                <a href={contacts.telegramUrl} target="_blank" rel="noopener" className={s.messenger}>
                  <TelegramIcon width={18} height={18} /> Telegram: {contacts.telegram}
                </a>
              </li>
              <li>
                <a href={contacts.whatsappUrl} target="_blank" rel="noopener" className={s.messenger}>
                  <WhatsAppIcon width={18} height={18} /> WhatsApp: {contacts.whatsapp}
                </a>
              </li>
              <li>
                E-mail: <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
              </li>
              <li className={s.muted}>Работаем: {contacts.workHours}</li>
            </ul>
            <a href="#contact" data-lead="new" className="btn btn--primary btn--sm">
              Обсудить проект
            </a>
          </div>
        </div>

        <div className={s.bottom}>
          <span>
            © {legal.year} {site.name}
          </span>
          <span>
            {legal.owner}, самозанятый, ИНН {legal.inn}
          </span>
          <a href={legal.privacyUrl}>Политика конфиденциальности</a>
          <a href={legal.consentUrl}>Согласие на обработку персональных данных</a>
        </div>
      </div>
    </footer>
  );
}
