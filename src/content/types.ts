/** Типы данных разделов контента. Поля описаны для админки в sections.ts, значения по умолчанию — в content/*.json. */

export type PlanId = "landing" | "corporate" | "catalog" | "service" | "shop";
export const PLAN_IDS: PlanId[] = ["landing", "corporate", "catalog", "service", "shop"];

export interface SiteSettings {
  name: string;
  url: string;
  /** Срок ответа на заявку, минут. */
  responseMinutes: number;
  /** Бесплатная поддержка после запуска, дней. */
  supportDays: number;
  city: string;
  contacts: {
    phone: string;
    phoneHref: string;
    telegram: string;
    telegramUrl: string;
    whatsapp: string;
    whatsappUrl: string;
    email: string;
    workHours: string;
  };
  /** Бесплатный аудит: за сколько часов и сколько проблем находим. */
  audit: { hours: string; problems: string };
  legal: { year: string; owner: string; inn: string };
}

export interface TeamContent {
  facts: { projects: string; years: string };
  members: { photo?: string; name: string; role: string; text: string }[];
}

export interface SiteType {
  id: PlanId;
  title: string;
  price: number;
  /** Срок в днях (может быть плейсхолдером «[7]») и слово в нужном падеже. */
  days: string;
  daysWord: string;
  popular?: boolean;
  /** Тариф в блоке «Цены». */
  description: string;
  features: string[];
  cta: string;
  /** Страница типа /sites/<id>. */
  summary: string;
  purpose: { title: string; text: string }[];
  audience: string[];
  alternatives: { when: string; id: PlanId }[];
}

export interface Service {
  id: string;
  title: string;
  audience: string;
  items: { name: string; text: string }[];
  includes: string[];
  price: string;
  /** Показать ссылки на типы сайтов (для услуги «Создание сайта»). */
  showSiteTypes?: boolean;
  seo: { title: string; description: string };
  summary: string;
  benefits: { title: string; text: string }[];
  signs: string[];
  process: { title: string; text: string }[];
  faq: FaqItem[];
  cta: { label: string; section: "quiz" | "contact"; lead?: "new" | "audit" };
}

export interface CaseDetails {
  client: string;
  tags: string[];
  facts: { value: string; label: string }[];
  task: string[];
  done: string[];
  result: string[];
  screenshot?: { src: string; width: number; height: number };
}

export interface Case {
  slug?: string;
  title: string;
  task: string;
  result: string;
  description?: string;
  image?: string;
  url: string;
  beforeAfter?: { before?: string; after?: string };
  details?: CaseDetails;
}

export type DetailedCase = Case & { slug: string; details: CaseDetails };

export interface FaqItem {
  q: string;
  a: string;
}

export type Surcharge = "redesign" | "migration" | "copywriting" | "seo" | "crm" | "payment" | "customFeatures";
export type QuizQuestionId = "type" | "current" | "design" | "extras" | "deadline";

export interface QuizContent {
  pricing: {
    surcharges: Record<Surcharge, Record<PlanId, number>>;
    design: { simple: number; custom: number; premium: number };
    rush: number;
    rangeSpread: number;
  };
  questions: { id: QuizQuestionId; title: string; options: { value: string; label: string; short?: string }[] }[];
  texts: {
    title: string;
    lead: string;
    multipleHint: string;
    resultTitle: string;
    noRangeTitle: string;
    included: string;
    formLead: string;
    channelLegend: string;
    contactLabel: string;
    submit: string;
    fine: string;
  };
}

/** Куда ведёт ссылка в блоке: страница сайта, модалка заявки или квиз. */
export type LinkTarget = string;

export interface Blocks {
  hero: {
    title: string;
    titleAccent: string;
    lead: string;
    badges: string[];
    primaryCta: string;
    secondaryCta: string;
    note: string;
    scrollHint: string;
  };
  why: {
    title: string;
    lead: string;
    aiTitle: string;
    aiTasks: string[];
    humanTitle: string;
    humanTasks: string[];
    summary: string;
    compareTitle: string;
    columns: { freelancer: string; studio: string; us: string };
    rows: { label: string; freelancer: string; studio: string; us: string }[];
    cta: string;
  };
  forWhom: {
    title: string;
    lead: string;
    tiles: { title: string; pain: string; solution: string; price: string; linkLabel: string; link: LinkTarget }[];
    ctaText: string;
    ctaButton: string;
  };
  services: {
    title: string;
    lead: string;
    moreLabel: string;
    nicheTitle: string;
    nicheText: string;
    nicheCta: string;
    allText: string;
    allButton: string;
  };
  pricing: { title: string; lead: string; popularBadge: string; moreLabel: string; ctaText: string; ctaButton: string };
  cases: { title: string; lead: string; homeCount: number; ctaText: string; allButton: string; discussButton: string };
  process: {
    title: string;
    lead: string;
    steps: { title: string; text: string; term: string }[];
    paymentTitle: string;
    paymentText: string;
    note: string;
    cta: string;
  };
  team: { title: string; lead: string; projectsLabel: string; yearsLabel: string; cta: string };
  guarantees: { title: string; lead: string; items: { icon: GuaranteeIcon; title: string; text: string }[]; cta: string };
  faq: { title: string; homeCount: number; allButton: string; askButton: string };
  contact: {
    title: string;
    lead: string;
    newTitle: string;
    newText: string;
    newSubmit: string;
    auditTitle: string;
    auditText: string;
    auditSubmit: string;
    fine: string;
  };
}

export type GuaranteeIcon = "contract" | "lock" | "calendar" | "steps" | "revisions" | "key" | "support";

export interface LayoutTexts {
  menu: { services: string; sites: string; cases: string; faq: string; contact: string };
  cta: string;
  footer: {
    about: string;
    navTitle: string;
    servicesTitle: string;
    servicesLinks: { label: string; href: string }[];
    contactsTitle: string;
    workHoursLabel: string;
    selfEmployed: string;
    privacyLink: string;
    consentLink: string;
  };
}

export interface FormTexts {
  modal: {
    newTab: string;
    newTitle: string;
    newText: string;
    newSubmit: string;
    auditTab: string;
    auditTitle: string;
    auditText: string;
    auditSubmit: string;
    fine: string;
  };
  fields: { url: string; name: string; contact: string; contactPlaceholder: string; channel: string; task: string };
  consentText: string;
  consentLink: string;
  success: string;
  sendError: string;
}

export interface Pages {
  home: { seoTitle: string; seoDescription: string };
  services: {
    seoTitle: string;
    seoDescription: string;
    title: string;
    lead: string;
    priceLabel: string;
    includesTitle: string;
    allTypes: string;
    ctaText: string;
    casesButton: string;
    discussButton: string;
  };
  service: {
    benefitsTitle: string;
    signsTitle: string;
    includesTitle: string;
    typesTitle: string;
    compareTypes: string;
    processTitle: string;
    faqTitle: string;
    allServices: string;
    ctaText: string;
    casesButton: string;
    discussButton: string;
  };
  sites: {
    seoTitle: string;
    seoDescription: string;
    title: string;
    lead: string;
    audienceTitle: string;
    moreLabel: string;
    pickTitle: string;
    pickText: string;
    pickQuiz: string;
    pickDiscuss: string;
  };
  siteType: {
    seoTitle: string;
    termPrefix: string;
    calcButton: string;
    purposeTitle: string;
    audienceTitle: string;
    featuresTitle: string;
    alternativesTitle: string;
    allTypes: string;
    ctaText: string;
    casesButton: string;
    discussButton: string;
  };
  cases: {
    seoTitle: string;
    seoDescription: string;
    title: string;
    lead: string;
    ctaText: string;
    discussButton: string;
    cardTask: string;
    cardResult: string;
    cardMore: string;
    viewSite: string;
    caseSeoTitle: string;
    detailTask: string;
    detailDone: string;
    detailResult: string;
    detailCta: string;
  };
  faq: { seoTitle: string; seoDescription: string; title: string };
}

export interface LegalDoc {
  title: string;
  seoDescription: string;
  lead: string;
  sections: { title: string; text?: string[]; list?: string[] }[];
}

/** Весь контент сайта — то, что получают страницы. */
export interface SiteContent {
  site: SiteSettings;
  team: TeamContent;
  siteTypes: SiteType[];
  services: Service[];
  cases: Case[];
  faq: FaqItem[];
  quiz: QuizContent;
  blocks: Blocks;
  layout: LayoutTexts;
  forms: FormTexts;
  pages: Pages;
  privacy: LegalDoc;
  consent: LegalDoc;
}
