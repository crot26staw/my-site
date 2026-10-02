import { quizQuestions, type QuizQuestion } from "@/config/quiz";
import type { DetailedCase, FormTexts, LayoutTexts, Pages, QuizContent, SiteContent, SiteSettings } from "@/content/types";
import { plansOf, type Plan } from "./format";
import type { PlanId } from "@/content/types";

/**
 * Часть контента для клиентских компонентов (шапка, модалки, формы, квиз).
 * Передаётся один раз через ContentProvider в layout — только то, что нужно в браузере.
 */
/** Ссылка на основной домен (slug null) или поддомен региона — для переключателя городов в шапке. */
export interface RegionLink {
  slug: string | null;
  name: string;
  url: string;
}

export interface ClientContent {
  site: Pick<SiteSettings, "name" | "url" | "responseMinutes" | "contacts">;
  layout: Pick<LayoutTexts, "menu" | "cta">;
  forms: FormTexts;
  quiz: { questions: QuizQuestion[]; pricing: QuizContent["pricing"]; texts: QuizContent["texts"]; plans: Record<PlanId, Plan> };
  /** Города для переключателя; пусто — регионов нет, переключатель не показываем. */
  regions: { current: string | null; links: RegionLink[] };
  cases: {
    items: DetailedCase[];
    labels: Pick<Pages["cases"], "title" | "seoTitle" | "caseSeoTitle" | "viewSite" | "detailTask" | "detailDone" | "detailResult" | "detailCta" | "discussButton">;
  };
}

export const detailedCases = (cases: SiteContent["cases"]) => cases.filter((c): c is DetailedCase => !!(c.slug && c.details));

export function clientContentOf(c: SiteContent, regionLinks: RegionLink[]): ClientContent {
  const p = c.pages.cases;
  return {
    site: { name: c.site.name, url: c.site.url, responseMinutes: c.site.responseMinutes, contacts: c.site.contacts },
    layout: { menu: c.layout.menu, cta: c.layout.cta },
    forms: c.forms,
    regions: { current: c.region.slug, links: regionLinks },
    quiz: { questions: quizQuestions(c.quiz), pricing: c.quiz.pricing, texts: c.quiz.texts, plans: plansOf(c.siteTypes) },
    cases: {
      items: detailedCases(c.cases),
      labels: {
        title: p.title,
        seoTitle: p.seoTitle,
        caseSeoTitle: p.caseSeoTitle,
        viewSite: p.viewSite,
        detailTask: p.detailTask,
        detailDone: p.detailDone,
        detailResult: p.detailResult,
        detailCta: p.detailCta,
        discussButton: p.discussButton,
      },
    },
  };
}
