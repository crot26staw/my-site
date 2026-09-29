import { plans, type PlanId } from "./site";

type PerPlan = Record<PlanId, number>;
const perPlan = (landing: number, corporate: number, catalog: number, service: number, shop: number): PerPlan => ({
  landing,
  corporate,
  catalog,
  service,
  shop,
});

/**
 * Квиз-калькулятор.
 * Нижняя граница = (цена тарифа × множитель дизайна + надбавки) × множитель срочности.
 * Верхняя граница = нижняя × (1 + rangeSpread / 100). Обе округляются до тысячи.
 */
export const quizPricing = {
  /** Цена тарифа из общего конфига. */
  base: Object.fromEntries(Object.entries(plans).map(([id, p]) => [id, p.price])) as PerPlan,
  /**
   * Надбавки в ₽ по тарифам: лендинг, корпоративный, каталог, сервис, магазин.
   * 0 — уже входит в тариф (см. features в siteTypes.ts).
   */
  surcharges: {
    // Анализ старого сайта, сохранение позиций в поиске и редиректы
    redesign: perPlan(5000, 10000, 15000, 15000, 20000),
    // Перенос контента, товаров и настроек — растёт с объёмом сайта
    migration: perPlan(5000, 15000, 25000, 20000, 35000),
    // Тексты входят в лендинг и всё, что его включает
    copywriting: perPlan(0, 0, 15000, 0, 20000),
    // В лендинге только базовая SEO, семантическое ядро — отдельно
    seo: perPlan(10000, 0, 0, 0, 0),
    crm: perPlan(15000, 20000, 25000, 0, 0),
    payment: perPlan(10000, 12000, 15000, 15000, 0),
    // В сервисе нишевые функции входят в тариф
    customFeatures: perPlan(25000, 35000, 40000, 0, 30000),
  } satisfies Record<string, PerPlan>,
  /** Множитель к цене тарифа за уровень дизайна. */
  design: { simple: 1, custom: 1.1, premium: 1.4 },
  /** Множитель ко всей сумме за срочный запуск. */
  rush: 1.2,
  /** Разброс диапазона, %. */
  rangeSpread: 25,
};

export type Surcharge = keyof typeof quizPricing.surcharges;

export interface QuizOption {
  value: string;
  label: string;
  /** Короткое название для расшифровки цены. */
  short?: string;
  surcharge?: Surcharge;
  /** Множитель к цене тарифа. */
  baseFactor?: number;
  /** Множитель ко всей сумме. */
  totalFactor?: number;
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
      { value: "redesign", label: "Есть, нужен редизайн", short: "Редизайн", surcharge: "redesign" },
      { value: "migration", label: "Есть, нужен перенос на другую платформу", short: "Перенос сайта", surcharge: "migration" },
    ],
  },
  {
    id: "design",
    title: "Какой дизайн вы хотите?",
    options: [
      { value: "simple", label: "Простой и аккуратный", baseFactor: quizPricing.design.simple },
      {
        value: "custom",
        label: "Индивидуальный, под наш бренд",
        short: "Дизайн под бренд",
        baseFactor: quizPricing.design.custom,
      },
      {
        value: "premium",
        label: "Премиальный, с анимацией и эффектами",
        short: "Премиальный дизайн",
        baseFactor: quizPricing.design.premium,
      },
    ],
  },
  {
    id: "extras",
    title: "Что ещё нужно?",
    multiple: true,
    options: [
      { value: "copywriting", label: "Продающие тексты", short: "Тексты", surcharge: "copywriting" },
      { value: "seo", label: "SEO-оптимизация и семантическое ядро", short: "SEO и семантика", surcharge: "seo" },
      { value: "crm", label: "Интеграция с CRM или 1С", short: "CRM или 1С", surcharge: "crm" },
      { value: "payment", label: "Онлайн-оплата", short: "Онлайн-оплата", surcharge: "payment" },
      { value: "custom", label: "Нестандартные функции (калькулятор, личный кабинет, запись)",
        short: "Нестандартные функции",
        surcharge: "customFeatures" },
      { value: "none", label: "Ничего из этого", exclusive: true },
    ],
  },
  {
    id: "deadline",
    title: "Когда нужен сайт?",
    options: [
      { value: "asap", label: "Как можно быстрее", short: "Срочный запуск", totalFactor: quizPricing.rush },
      { value: "month", label: "В течение месяца" },
      { value: "relaxed", label: "Сроки не горят" },
    ],
  },
];

export type QuizAnswers = Partial<Record<QuizQuestion["id"], string[]>>;

export interface QuizLine {
  label: string;
  /** Надбавка в ₽ (0 — входит в тариф) или процент для множителя ко всей сумме. */
  amount?: number;
  percent?: number;
}

const round1000 = (v: number) => Math.round(v / 1000) * 1000;

/** Диапазон цены и расшифровка. null — тип сайта не выбран или «пока не знаю». */
export function quizRange(answers: QuizAnswers): { min: number; max: number; lines: QuizLine[] } | null {
  const type = answers.type?.[0] as PlanId | typeof UNKNOWN_TYPE | undefined;
  if (!type || type === UNKNOWN_TYPE) return null;
  const base = quizPricing.base[type];
  const lines: QuizLine[] = [{ label: plans[type].title, amount: base }];
  let total = base;
  let factor = 1;
  for (const q of quizQuestions) {
    for (const value of answers[q.id] ?? []) {
      const o = q.options.find((opt) => opt.value === value);
      if (!o) continue;
      const label = o.short ?? o.label;
      if (o.baseFactor && o.baseFactor !== 1) {
        const amount = Math.round(base * (o.baseFactor - 1));
        total += amount;
        lines.push({ label, amount });
      }
      if (o.surcharge) {
        const amount = quizPricing.surcharges[o.surcharge][type];
        total += amount;
        lines.push({ label, amount });
      }
      if (o.totalFactor && o.totalFactor !== 1) {
        factor *= o.totalFactor;
        lines.push({ label, percent: Math.round((o.totalFactor - 1) * 100) });
      }
    }
  }
  const min = round1000(total * factor);
  return { min, max: round1000(min * (1 + quizPricing.rangeSpread / 100)), lines };
}
