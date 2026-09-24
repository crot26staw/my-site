"use client";

import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { TelegramIcon, WhatsAppIcon } from "../icons";
import s from "./Header.module.css";

const menu = [
  { href: "#services", label: "Услуги" },
  { href: "#pricing", label: "Цены" },
  { href: "#cases", label: "Кейсы" },
  { href: "#process", label: "Как мы работаем" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Контакты" },
];

export function Header() {
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
        <a href="#top" className={s.logo}>
          {site.logo}
        </a>

        <nav id="main-nav" className={s.nav} data-open={open || undefined} aria-label="Основное меню">
          <ul className={s.menu}>
            {menu.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={s.link} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
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
