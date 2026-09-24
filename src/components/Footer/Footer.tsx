import { legal, site } from "@/config/site";
import { TelegramIcon, WhatsAppIcon } from "../icons";
import s from "./Footer.module.css";

const nav = [
  { href: "#services", label: "Услуги" },
  { href: "#pricing", label: "Цены" },
  { href: "#cases", label: "Кейсы" },
  { href: "#process", label: "Как мы работаем" },
  { href: "#faq", label: "FAQ" },
];

// Пока отдельных страниц услуг нет — все ведут на блок «Услуги».
const services = [
  "Лендинги",
  "Корпоративные сайты",
  "Каталоги и интернет-магазины",
  "Редизайн и перенос сайтов",
  "Аудит и SEO-оптимизация",
];

export function Footer() {
  const { contacts } = site;
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.grid}>
          <div className={s.col}>
            <a href="#top" className={s.logo}>
              {site.logo}
            </a>
            <p className={s.about}>Сайты под ключ быстрее и дешевле. Разработка, дизайн и SEO с использованием AI-инструментов.</p>
          </div>

          <nav className={s.col} aria-label="Навигация в подвале">
            <h2 className={s.heading}>Навигация</h2>
            <ul className={s.list}>
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={s.col}>
            <h2 className={s.heading}>Услуги</h2>
            <ul className={s.list}>
              {services.map((label) => (
                <li key={label}>
                  <a href="#services">{label}</a>
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
