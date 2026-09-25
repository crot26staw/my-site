"use client";

import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { TelegramIcon, WhatsAppIcon } from "../icons";
import { PageLink, SectionLink, type SitePage } from "../PageLink";
import s from "./Header.module.css";

/** section — блок главной, page — отдельная страница. */
const menu: { label: string; section?: string; page?: SitePage }[] = [
  { page: "services", label: "Услуги" },
  { page: "site-architecture", label: "Типы сайтов и цены" },
  { page: "cases", label: "Кейсы" },
  { section: "process", label: "Как мы работаем" },
  { page: "faq", label: "FAQ" },
  { section: "contact", label: "Контакты" },
];

export function Header({ page = "home" }: { page?: SitePage }) {
  const onHome = page === "home";
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
          <a href="#top" className={s.logo}>
            {site.logo}
          </a>
        ) : (
          <PageLink href="/" className={s.logo}>
            {site.logo}
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
            Обсудить проект
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
