import { consentPath, privacyPath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { LogoMark, TelegramIcon, WhatsAppIcon } from "../icons";
import { PageLink, type SitePage } from "../PageLink";
import s from "./Footer.module.css";

/** На отдельных страницах (page ≠ home) нет 3D-двери за футером — отступ сверху как в обычном режиме. */
export async function Footer({ page = "home" }: { page?: SitePage }) {
  const { site, layout } = await getContent();
  const { contacts, legal } = site;
  const t = layout.footer;
  const nav: { label: string; page: SitePage }[] = [
    { page: "services", label: layout.menu.services },
    { page: "sites", label: layout.menu.sites },
    { page: "cases", label: layout.menu.cases },
    { page: "faq", label: layout.menu.faq },
  ];
  const onHome = page === "home";
  return (
    <footer className={onHome ? s.footer : `${s.footer} ${s.plain}`}>
      <div className={s.inner}>
        <div className={s.grid}>
          <div className={s.col}>
            {onHome ? (
              <a href="#top" className={s.logo} aria-label={`${site.name} — на главную`}>
                <LogoMark className={s.mark} />
                <span>{site.name}</span>
              </a>
            ) : (
              <PageLink href="/" className={s.logo} aria-label={`${site.name} — на главную`}>
                <LogoMark className={s.mark} />
                <span>{site.name}</span>
              </PageLink>
            )}
            <p className={s.about}>{t.about}</p>
          </div>

          <nav className={s.col} aria-label="Навигация в подвале">
            <h2 className={s.heading}>{t.navTitle}</h2>
            <ul className={s.list}>
              {nav.map((item) => (
                <li key={item.label}>
                  <PageLink href={`/${item.page}`} aria-current={item.page === page ? "page" : undefined}>
                    {item.label}
                  </PageLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={s.col}>
            <h2 className={s.heading}>{t.servicesTitle}</h2>
            <ul className={s.list}>
              {t.servicesLinks.map((item) => (
                <li key={item.href + item.label}>
                  <PageLink href={item.href}>{item.label}</PageLink>
                </li>
              ))}
            </ul>
          </div>

          <div className={s.col}>
            <h2 className={s.heading}>{t.contactsTitle}</h2>
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
              <li className={s.muted}>
                {t.workHoursLabel} {contacts.workHours}
              </li>
            </ul>
            <a href="#contact" data-lead="new" className="btn btn--primary btn--sm">
              {layout.cta}
            </a>
          </div>
        </div>

        <div className={s.bottom}>
          <span>
            © {legal.year} {site.name}
          </span>
          <span>{t.selfEmployed}</span>
          <PageLink href={privacyPath}>{t.privacyLink}</PageLink>
          <PageLink href={consentPath}>{t.consentLink}</PageLink>
        </div>
      </div>
    </footer>
  );
}
