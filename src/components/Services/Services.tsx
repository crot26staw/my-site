import type { LeadVariant } from "../LeadModal/LeadModal";
import { Room } from "../Room/Room";
import s from "./Services.module.css";

interface Service {
  title: string;
  audience: string;
  items: { name: string; text: string }[];
  /** lead — открыть модалку заявки с этой формой (href — запасной путь без JS). */
  cta: { label: string; href: string; lead?: LeadVariant };
}

const services: Service[] = [
  {
    title: "Создание сайта с нуля",
    audience: "Для тех, у кого сайта ещё нет.",
    items: [
      { name: "Разработка сайтов", text: "лендинги, корпоративные сайты, каталоги и интернет-магазины" },
      { name: "Веб-дизайн", text: "от лаконичного до премиального, под вашу аудиторию и бренд" },
      { name: "Продающие тексты", text: "пишем так, чтобы посетитель стал клиентом" },
    ],
    cta: { label: "Рассчитать стоимость", href: "#quiz" },
  },
  {
    title: "Улучшение текущего сайта",
    audience: "Для тех, у кого сайт есть, но не приносит результата.",
    items: [
      { name: "Аудит и оптимизация", text: "находим технические ошибки, проблемы со скоростью и удобством" },
      { name: "Редизайн", text: "обновляем внешний вид и структуру, сохраняя то, что уже работает" },
    ],
    cta: { label: "Получить бесплатный аудит", href: "#contact", lead: "audit" },
  },
  {
    title: "Переезд на новую платформу",
    audience: "Для тех, кого ограничивает текущая CMS.",
    items: [
      {
        name: "Миграция",
        text: "переносим сайт на другую CMS или кастомное решение без потери данных и позиций в поиске",
      },
    ],
    cta: { label: "Обсудить переезд", href: "#contact", lead: "new" },
  },
  {
    title: "Продвижение в поиске",
    audience: "Для тех, кому нужен поток клиентов из Яндекса и Google.",
    items: [
      { name: "Семантическое ядро", text: "собираем запросы, по которым ищут именно ваших клиентов" },
      { name: "SEO-оптимизация", text: "сайт с самого начала готов к росту в поиске" },
    ],
    cta: { label: "Узнать подробнее", href: "#contact", lead: "new" },
  },
];

export function Services() {
  return (
    <Room
      id="services"
      room="services"
      index="03"
      title="Что мы делаем"
      lead="Берём на себя весь цикл работы над сайтом: от идеи и дизайна до продвижения в поиске. Можно заказать проект под ключ или отдельную услугу."
    >
      <div className={s.grid}>
        {services.map((service, i) => (
          <article key={service.title} className={s.card} data-reveal>
            <span className={s.num} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={s.title}>{service.title}</h3>
            <p className={s.audience}>
              <em>{service.audience}</em>
            </p>
            <ul className={s.items}>
              {service.items.map((item) => (
                <li key={item.name}>
                  <strong>{item.name}:</strong> {item.text}
                </li>
              ))}
            </ul>
            <a href={service.cta.href} data-lead={service.cta.lead} className={`btn btn--outline ${s.cta}`}>
              {service.cta.label}
            </a>
          </article>
        ))}

        <article className={`${s.card} ${s.wide}`} data-reveal>
          <div className={s.wideText}>
            <h3 className={s.title}>Нишевые функции под ваш бизнес</h3>
            <p className={s.wideLead}>
              Онлайн-запись, калькуляторы, личные кабинеты, интеграции с CRM и другие фичи, которые решают конкретные
              задачи вашего бизнеса.
            </p>
          </div>
          <a href="#contact" data-lead="new" className={`btn btn--primary ${s.cta}`}>
            Обсудить задачу
          </a>
        </article>
      </div>
    </Room>
  );
}
