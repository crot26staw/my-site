import { plans, type PlanId } from "./site";

/**
 * Квиз-калькулятор. Диапазон = базовая цена тарифа + надбавки за ответы.
 * [таблица наценок: заполнит заказчик] — пока значения null, они не учитываются,
 * а верхняя граница диапазона выводится плейсхолдером [Y].
 */
export const quizPricing = {
  /** Нижняя граница — цена тарифа из общего конфига. */
  base: Object.fromEntries(Object.entries(plans).map(([id, p]) => [id, p.price])) as Record<PlanId, number>,
  surcharges: {
    redesign: null as number | null, // [N] ₽
    migration: null as number | null, // [N] ₽
    designPremium: null as number | null, // [N] ₽
    designCustom: null as number | null, // [N] ₽
    copywriting: null as number | null, // [N] ₽
    seo: null as number | null, // [N] ₽
    crm: null as number | null, // [N] ₽ (CRM или 1С)
    payment: null as number | null, // [N] ₽
    customFeatures: null as number | null, // [N] ₽
  },
  /** Верхняя граница = нижняя × (1 + rangeSpread / 100). [N]% */
  rangeSpread: null as number | null,
};

export type Surcharge = keyof typeof quizPricing.surcharges;

export interface QuizOption {
  value: string;
  label: string;
  surcharge?: Surcharge;
  /** «Ничего из этого» — снимает остальные отметки. */
  exclusive?: boolean;
}

export interface QuizQuestion {
  id: "type" | "current" | "design" | "extras" | "deadline";
  title: string;
  multiple?: boolean;
  options: QuizOption[];
}

export const UNKNOWN_TYPE = "unknown";

export const quizQuestions: QuizQuestion[] = [
  {
    id: "type",
    title: "Какой сайт вам нужен?",
    options: [
      { value: "landing", label: "Лендинг (одна страница)" },
      { value: "corporate", label: "Корпоративный сайт" },
      { value: "catalog", label: "Сайт-каталог" },
      { value: "service", label: "Сайт для сервиса" },
      { value: "shop", label: "Интернет-магазин" },
      { value: UNKNOWN_TYPE, label: "Пока не знаю, нужна консультация" },
    ],
  },
  {
    id: "current",
    title: "Есть ли у вас сейчас сайт?",
    options: [
      { value: "none", label: "Нет, делаем с нуля" },
      { value: "redesign", label: "Есть, нужен редизайн", surcharge: "redesign" },
      { value: "migration", label: "Есть, нужен перенос на другую платформу", surcharge: "migration" },
    ],
  },
  {
    id: "design",
    title: "Какой дизайн вы хотите?",
    options: [
      { value: "simple", label: "Простой и аккуратный" },
      { value: "custom", label: "Индивидуальный, под наш бренд", surcharge: "designCustom" },
      { value: "premium", label: "Премиальный, с анимацией и эффектами", surcharge: "designPremium" },
    ],
  },
  {
    id: "extras",
    title: "Что ещё нужно?",
    multiple: true,
    options: [
      { value: "copywriting", label: "Продающие тексты", surcharge: "copywriting" },
      { value: "seo", label: "SEO-оптимизация и семантическое ядро", surcharge: "seo" },
      { value: "crm", label: "Интеграция с CRM или 1С", surcharge: "crm" },
      { value: "payment", label: "Онлайн-оплата", surcharge: "payment" },
      { value: "custom", label: "Нестандартные функции (калькулятор, личный кабинет, запись)", surcharge: "customFeatures" },
      { value: "none", label: "Ничего из этого", exclusive: true },
    ],
  },
  {
    // На цену не влияет, но передаётся в заявке (срочность).
    id: "deadline",
    title: "Когда нужен сайт?",
    options: [
      { value: "asap", label: "Как можно быстрее" },
      { value: "month", label: "В течение месяца" },
      { value: "relaxed", label: "Сроки не горят" },
    ],
  },
];

export type QuizAnswers = Partial<Record<QuizQuestion["id"], string[]>>;

/** Диапазон цены. max = null, пока заказчик не заполнил rangeSpread. */
export function quizRange(answers: QuizAnswers): { min: number; max: number | null } | null {
  const type = answers.type?.[0];
  if (!type || type === UNKNOWN_TYPE) return null;
  let min = quizPricing.base[type as PlanId];
  for (const q of quizQuestions) {
    for (const value of answers[q.id] ?? []) {
      const key = q.options.find((o) => o.value === value)?.surcharge;
      const add = key ? quizPricing.surcharges[key] : null;
      if (add) min += add;
    }
  }
  const spread = quizPricing.rangeSpread;
  return { min, max: spread === null ? null : Math.round((min * (1 + spread / 100)) / 1000) * 1000 };
}
