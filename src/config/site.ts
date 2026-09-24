/**
 * Единый источник данных сайта.
 * Всё в квадратных скобках [...] — плейсхолдеры, которые заполнит заказчик.
 * Цены, сроки, контакты и время ответа подставляются во все блоки только отсюда.
 */

export const site = {
  name: "[Название]",
  logo: "[Логотип]",
  url: "https://example.com", // TODO: [домен сайта]
  /** Срок ответа на заявку, минут. */
  responseMinutes: 60,
  contacts: {
    phone: "[Телефон]",
    phoneHref: "tel:+70000000000", // TODO: [Телефон в формате +7...]
    telegram: "[@ник]",
    telegramUrl: "https://t.me/", // TODO: https://t.me/[ник]
    whatsapp: "[номер]",
    whatsappUrl: "https://wa.me/", // TODO: https://wa.me/[номер]
    email: "[почта]",
    workHours: "[пн–пт, 10:00–19:00 МСК]",
  },
} as const;

export type PlanId = "landing" | "corporate" | "catalog" | "service" | "shop";

export interface Plan {
  title: string;
  price: number;
  /** Срок в днях (плейсхолдер) и слово в нужном падеже: «[7]» + «дней». */
  days: string;
  daysWord: string;
  /** «от [7] дней» */
  term: string;
}

const plan = (title: string, price: number, days: string, daysWord: string): Plan => ({
  title,
  price,
  days,
  daysWord,
  term: `от\u00A0${days}\u00A0${daysWord}`,
});

export const plans: Record<PlanId, Plan> = {
  landing: plan("Лендинг", 30000, "[7]", "дней"),
  corporate: plan("Корпоративный сайт", 70000, "[14]", "дней"),
  catalog: plan("Сайт-каталог", 70000, "[14]", "дней"),
  service: plan("Сайт для сервиса", 100000, "[21]", "дня"),
  shop: plan("Интернет-магазин", 120000, "[30]", "дней"),
};

/** Данные конкурентов для сравнительной таблицы в блоке «Почему». */
export const competitors = {
  freelancer: { landingPrice: "[15–30 тыс. ₽]" },
  studio: { landingPrice: "[80–150 тыс. ₽]", term: "[1–2 месяца]" },
};

const priceFormatter = new Intl.NumberFormat("ru-RU");

/** 30000 → «30 000 ₽» (с неразрывными пробелами). */
export function formatPrice(value: number): string {
  return `${priceFormatter.format(value).replace(/\s/g, " ")} ₽`;
}

/** 30000 → «от 30 000 ₽». */
export function fromPrice(value: number): string {
  return `от ${formatPrice(value)}`;
}

/** Бесплатная поддержка после запуска, дней. */
export const supportDays = 14;

/** Поэтапная оплата, % (плейсхолдеры). */
export const paymentSchedule = {
  afterContract: "[30]",
  afterDesign: "[40]",
  afterLaunch: "[30]",
};

/** Бесплатный аудит. */
export const audit = { hours: "[24]", problems: "[5]" };

export const team = {
  facts: { projects: "[N]", years: "[N]" },
  members: [
    { photo: "[Фото]", name: "[Имя Фамилия]", role: "Руководитель проектов" },
    { photo: "[Фото]", name: "[Имя Фамилия]", role: "Дизайнер, разработчик и SEO-специалист" },
  ],
};

export const legal = {
  year: "[2026]",
  owner: "[ФИО]",
  inn: "[номер]",
  privacyUrl: "/privacy",
  consentUrl: "/consent",
};

/** Город для вопроса в FAQ. */
export const city = "[вашем городе]";
