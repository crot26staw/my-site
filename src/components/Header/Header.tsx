"use client";

import { useEffect, useState } from "react";
import { useSiteContent } from "../ContentProvider";
import { LogoMark, TelegramIcon, WhatsAppIcon } from "../icons";
import { PageLink, SectionLink, type SitePage } from "../PageLink";
import s from "./Header.module.css";

export function Header({ page = "home" }: { page?: SitePage }) {
  const { site, layout } = useSiteContent();
  const onHome = page === "home";
  /** section — блок главной, page — отдельная страница. */
  const menu: { label: string; section?: string; page?: SitePage }[] = [
    { page: "services", label: layout.menu.services },
    { page: "sites", label: layout.menu.sites },
    { page: "cases", label: layout.menu.cases },
    { page: "faq", label: layout.menu.faq },
    { section: "contact", label: layout.menu.contact },
  ];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const { contacts } = site;

  return (
    <header className={s.header}>
      <div className={s.inner}>
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

        <nav id="main-nav" className={s.nav} data-open={open || undefined} aria-label="Основное меню">
          <ul className={s.menu}>
            {menu.map((item) => (
              <li key={item.label}>
                {item.page ? (
                  <PageLink
                    href={`/${item.page}`}
                    className={s.link}
                    aria-current={item.page === page ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </PageLink>
                ) : (
                  <SectionLink id={item.section!} onHome={onHome} className={s.link} onClick={() => setOpen(false)}>
                    {item.label}
                  </SectionLink>
                )}
              </li>
            ))}
          </ul>
          <a href={contacts.phoneHref} className={s.drawerPhone}>
            {contacts.phone}
          </a>
        </nav>

        <div className={s.actions}>
          <a href={contacts.phoneHref} className={s.phone}>
            {contacts.phone}
          </a>
          <a href={contacts.telegramUrl} className={s.icon} target="_blank" rel="noopener" aria-label={`Telegram ${contacts.telegram}`}>
            <TelegramIcon />
          </a>
          <a href={contacts.whatsappUrl} className={s.icon} target="_blank" rel="noopener" aria-label={`WhatsApp ${contacts.whatsapp}`}>
            <WhatsAppIcon />
          </a>
          <a href="#contact" data-lead="new" className={`btn btn--primary btn--sm ${s.cta}`}>
            {layout.cta}
          </a>
          <button
            type="button"
            className={s.burger}
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
