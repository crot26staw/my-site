import type { PlanId, QuizContent, QuizQuestionId, Surcharge } from "@/content/types";
import type { Plan } from "@/lib/format";

/**
 * Квиз-калькулятор. Тексты вопросов и цифры — в админке (раздел «Калькулятор стоимости»),
 * здесь — логика: какой ответ даёт какую надбавку или множитель.
 * Нижняя граница = (цена тарифа × множитель дизайна + надбавки) × множитель срочности.
 * Верхняя граница = нижняя × (1 + rangeSpread / 100). Обе округляются до тысячи.
 */

export const UNKNOWN_TYPE = "unknown";

type DesignLevel = keyof QuizContent["pricing"]["design"];

interface OptionLogic {
  surcharge?: Surcharge;
  /** Множитель к цене тарифа — уровень дизайна. */
  design?: DesignLevel;
  /** Множитель ко всей сумме — срочность. */
  rush?: boolean;
  /** «Ничего из этого» — снимает остальные отметки. */
  exclusive?: boolean;
}

const LOGIC: Record<QuizQuestionId, { multiple?: boolean; options: Record<string, OptionLogic> }> = {
  type: { options: {} },
  current: { options: { redesign: { surcharge: "redesign" }, migration: { surcharge: "migration" } } },
  design: { options: { simple: { design: "simple" }, custom: { design: "custom" }, premium: { design: "premium" } } },
  extras: {
    multiple: true,
    options: {
      copywriting: { surcharge: "copywriting" },
      seo: { surcharge: "seo" },
      crm: { surcharge: "crm" },
      payment: { surcharge: "payment" },
      custom: { surcharge: "customFeatures" },
      none: { exclusive: true },
    },
  },
  deadline: { options: { asap: { rush: true } } },
};

export interface QuizOption extends OptionLogic {
  value: string;
  label: string;
  short?: string;
}

export interface QuizQuestion {
  id: QuizQuestionId;
  title: string;
  multiple?: boolean;
  options: QuizOption[];
}

/** Вопросы с текстами из админки и логикой отсюда. */
export function quizQuestions(quiz: QuizContent): QuizQuestion[] {
  return quiz.questions.map((q) => ({
    id: q.id,
    title: q.title,
    multiple: LOGIC[q.id]?.multiple,
    options: q.options.map((o) => ({ ...o, ...LOGIC[q.id]?.options[o.value] })),
  }));
}

export type QuizAnswers = Partial<Record<QuizQuestionId, string[]>>;

export interface QuizLine {
  label: string;
  /** Надбавка в ₽ (0 — входит в тариф) или процент для множителя ко всей сумме. */
  amount?: number;
  percent?: number;
}

const round1000 = (v: number) => Math.round(v / 1000) * 1000;

/** Диапазон цены и расшифровка. null — тип сайта не выбран или «пока не знаю». */
export function quizRange(
  answers: QuizAnswers,
  questions: QuizQuestion[],
  pricing: QuizContent["pricing"],
  plans: Record<PlanId, Plan>,
): { min: number; max: number; lines: QuizLine[] } | null {
  const type = answers.type?.[0];
  if (!type || type === UNKNOWN_TYPE || !(type in plans)) return null;
  const plan = plans[type as PlanId];
  const base = plan.price;
  const lines: QuizLine[] = [{ label: plan.title, amount: base }];
  let total = base;
  let factor = 1;
  for (const q of questions) {
    for (const value of answers[q.id] ?? []) {
      const o = q.options.find((opt) => opt.value === value);
      if (!o) continue;
      const label = o.short ?? o.label;
      const designFactor = o.design ? pricing.design[o.design] : 1;
      if (designFactor !== 1) {
        const amount = Math.round(base * (designFactor - 1));
        total += amount;
        lines.push({ label, amount });
      }
      if (o.surcharge) {
        const amount = pricing.surcharges[o.surcharge][type as PlanId];
        total += amount;
        lines.push({ label, amount });
      }
      if (o.rush && pricing.rush !== 1) {
        factor *= pricing.rush;
        lines.push({ label, percent: Math.round((pricing.rush - 1) * 100) });
      }
    }
  }
  const min = round1000(total * factor);
  return { min, max: round1000(min * (1 + pricing.rangeSpread / 100)), lines };
}
