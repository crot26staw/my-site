import type { PlanId, SiteType } from "@/content/types";

const priceFormatter = new Intl.NumberFormat("ru-RU");

/** 30000 → «30 000 ₽» (с неразрывными пробелами). */
export function formatPrice(value: number): string {
  return `${priceFormatter.format(value).replace(/\s/g, " ")} ₽`;
}

/** 30000 → «от 30 000 ₽». */
export function fromPrice(value: number): string {
  return `от ${formatPrice(value)}`;
}

export interface Plan {
  title: string;
  price: number;
  /** «[7] дней» */
  days: string;
  /** «от [7] дней» */
  term: string;
}

/** Тарифы по коду типа сайта: название, цена и срок. */
export function plansOf(siteTypes: SiteType[]): Record<PlanId, Plan> {
  return Object.fromEntries(
    siteTypes.map((t) => {
      const days = `${t.days} ${t.daysWord}`;
      return [t.id, { title: t.title, price: t.price, days, term: `от ${days}` }];
    }),
  ) as Record<PlanId, Plan>;
}

/** «Сайт-каталог» → «сайт-каталог»: название внутри фразы. */
export const lowerFirst = (title: string) => title.charAt(0).toLowerCase() + title.slice(1);
