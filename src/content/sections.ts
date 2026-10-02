/**
 * Разделы админки: что редактируется, как называется и как проверяется.
 * Ключ раздела = строка в таблице content и файл content/<ключ>.json со значениями по умолчанию.
 */

import {
  area,
  bool,
  image,
  key,
  lines,
  list,
  num,
  obj,
  screenshot,
  select,
  text,
  type Field,
  type ObjectField,
  type ValidationError,
} from "./schema";
import { PLAN_IDS, type PlanId } from "./types";

export type SectionGroup = "main" | "catalog" | "home" | "pages" | "docs";

export const GROUPS: { id: SectionGroup; title: string }[] = [
  { id: "main", title: "Основное" },
  { id: "catalog", title: "Услуги и работы" },
  { id: "home", title: "Блоки главной" },
  { id: "pages", title: "Страницы" },
  { id: "docs", title: "Документы" },
];

export interface SectionDef {
  key: string;
  title: string;
  group: SectionGroup;
  description: string;
  schema: Field;
  /** Проверки, которые зависят от нескольких полей (уникальность адресов и т.п.). */
  check?: (data: unknown) => ValidationError[];
}

/* Переменные: подставляются в любой текст. Список — для подсказки в админке. */

const PLAN_NAMES: Record<PlanId, string> = {
  landing: "лендинг",
  corporate: "корпоративный",
  catalog: "каталог",
  service: "сервис",
  shop: "магазин",
};
export const planVarName = (id: PlanId) => PLAN_NAMES[id];

export const VARIABLES: { name: string; description: string }[] = [
  { name: "название", description: "название сайта" },
  { name: "срок_ответа", description: "за сколько минут отвечаем на заявку" },
  { name: "дни_поддержки", description: "дней бесплатной поддержки" },
  { name: "аудит_часы", description: "за сколько часов делаем аудит" },
  { name: "аудит_проблемы", description: "сколько проблем находим в аудите" },
  { name: "город", description: "«Казани» — город региона, где: «в {город}»" },
  { name: "город_им", description: "«Казань» — город региона, именительный падеж" },
  { name: "город_род", description: "«Казани» — город региона, родительный падеж: «из {город_род}»" },
  { name: "телефон", description: "телефон" },
  { name: "email", description: "почта" },
  { name: "владелец", description: "ФИО владельца" },
  { name: "инн", description: "ИНН" },
  { name: "год", description: "год в подвале" },
  ...PLAN_IDS.flatMap((id) => [
    { name: `цена_${PLAN_NAMES[id]}`, description: `«от 30 000 ₽» — цена: ${PLAN_NAMES[id]}` },
    { name: `срок_${PLAN_NAMES[id]}`, description: `«от 7 дней» — срок: ${PLAN_NAMES[id]}` },
    { name: `дни_${PLAN_NAMES[id]}`, description: `«7 дней» — срок без «от»: ${PLAN_NAMES[id]}` },
  ]),
];

/* Общие куски */

const planOptions = PLAN_IDS.map((id) => ({ value: id, label: PLAN_NAMES[id][0].toUpperCase() + PLAN_NAMES[id].slice(1) }));

const titleText = list("Карточки", obj({ title: text("Заголовок", { max: 120 }), text: area("Текст", { max: 600 }) }), {
  max: 12,
  titleKey: "title",
  itemLabel: "карточку",
});

const faqList = (label: string, max: number) =>
  list(label, obj({ q: text("Вопрос", { max: 200 }), a: area("Ответ", { max: 2000 }) }), { max, titleKey: "q", itemLabel: "вопрос" });

/** Куда ведёт кнопка или ссылка. */
const LINK_TARGETS = [
  ...PLAN_IDS.map((id) => ({ value: `/sites/${id}`, label: `Страница типа сайта: ${PLAN_NAMES[id]}` })),
  { value: "/sites", label: "Страница «Типы сайтов и цены»" },
  { value: "/services", label: "Страница «Услуги»" },
  { value: "/cases", label: "Страница «Кейсы»" },
  { value: "#lead-new", label: "Форма заявки: новый сайт" },
  { value: "#lead-audit", label: "Форма заявки: аудит" },
  { value: "#quiz", label: "Калькулятор стоимости" },
];

const seo = (titleHint = "До 60 символов, в конце сайт сам добавит « — название».") => ({
  seoTitle: text("Заголовок для поиска (title)", { max: 90, hint: titleHint }),
  seoDescription: area("Описание для поиска (description)", { max: 300, hint: "120–160 символов: что на странице и почему стоит зайти." }),
});

/** Мета-теги региона: пустое поле — текст основного домена. */
const seoOverride = (titleHint?: string) => ({
  seoTitle: text("Заголовок для поиска (title)", { max: 120, optional: true, hint: titleHint }),
  seoDescription: area("Описание для поиска (description)", { max: 300, optional: true }),
});

const cityFields = {
  name: text("Город", { max: 60, hint: "Именительный падеж: «Казань». Переменная {город_им}." }),
  nameGen: text("Город — родительный падеж", { max: 60, hint: "«Казани» — для «из {город_род}». Переменная {город_род}." }),
  namePrep: text("Город — предложный падеж", { max: 60, hint: "Без предлога: «Казани» — для «в {город}». Переменная {город}." }),
};

/** Мета-теги страниц и услуг для поддоменов: у региона и в общем шаблоне. */
const regionSeoFields = (emptyHint: string) => ({
  seo: obj(
    {
      home: obj(seoOverride("Полностью, вместе с названием: «… — {название}»."), { label: "Главная" }),
      services: obj(seoOverride(), { label: "Страница «Услуги»" }),
      sites: obj(seoOverride(), { label: "Страница «Типы сайтов»" }),
      siteType: obj(
        {
          seoTitle: text("Заголовок для поиска", { max: 120, optional: true, hint: "Работают {тип} и {цена}." }),
          seoDescription: area("Описание для поиска", {
            max: 300,
            optional: true,
            hint: "Работают {тип} и {цена}. Пусто — подзаголовок типа сайта, как на основном домене.",
          }),
        },
        { label: "Страница типа сайта" },
      ),
      cases: obj(
        {
          ...seoOverride(),
          caseSeoTitle: text("Кейс — заголовок для поиска", { max: 120, optional: true, hint: "Работает {кейс}." }),
        },
        { label: "Страница «Кейсы»" },
      ),
      faq: obj(seoOverride(), { label: "Страница «Вопросы»" }),
    },
    { label: "Мета-теги страниц", hint: emptyHint },
  ),
  services: list(
    "Мета-теги услуг",
    obj({
      id: text("Адрес услуги", { format: "slug", hint: "Как в разделе «Услуги»: seo — для страницы /services/seo." }),
      title: text("Заголовок для поиска", { max: 90, optional: true }),
      description: area("Описание для поиска", { max: 300, optional: true }),
    }),
    { max: 12, titleKey: "id", itemLabel: "услугу" },
  ),
});

/** Поддомены, которые нельзя отдать региону. */
const RESERVED_SUBDOMAINS = ["www", "mail", "api", "admin"];

function uniqueBy(items: unknown, field: string, label: string, listPath = ""): ValidationError[] {
  if (!Array.isArray(items)) return [];
  const seen = new Map<string, number>();
  const errors: ValidationError[] = [];
  items.forEach((item, i) => {
    const v = (item as Record<string, unknown>)?.[field];
    if (typeof v !== "string" || !v) return;
    if (seen.has(v)) errors.push({ path: `${listPath ? listPath + "." : ""}${i}.${field}`, message: `${label} «${v}» уже есть выше` });
    seen.set(v, i);
  });
  return errors;
}

/* Разделы */

export const SECTIONS: SectionDef[] = [
  {
    key: "site",
    title: "Контакты и реквизиты",
    group: "main",
    description: "Название, контакты, сроки и реквизиты. Используются во всех блоках и в переменных.",
    schema: obj({
      name: text("Название сайта", { max: 40 }),
      url: text("Адрес сайта", { format: "url", hint: "Например https://web-lite.ru — для поиска и ссылок в мессенджерах." }),
      responseMinutes: num("Отвечаем на заявку за, минут", { min: 1, max: 1440, integer: true, hint: "Переменная {срок_ответа}." }),
      supportDays: num("Бесплатная поддержка, дней", { min: 0, max: 365, integer: true, hint: "Переменная {дни_поддержки}." }),
      contacts: obj(
        {
          phone: text("Телефон — как показывать", { max: 40, placeholder: "+7 999 123-45-67" }),
          phoneHref: text("Телефон — для звонка", { format: "tel", hint: "tel:+79991234567 — без пробелов и скобок." }),
          telegram: text("Telegram — как показывать", { max: 40, placeholder: "@nick" }),
          telegramUrl: text("Telegram — ссылка", { format: "url", placeholder: "https://t.me/nick" }),
          whatsapp: text("WhatsApp — как показывать", { max: 40 }),
          whatsappUrl: text("WhatsApp — ссылка", { format: "url", placeholder: "https://wa.me/79991234567" }),
          email: text("Почта", { format: "email" }),
          workHours: text("Часы работы", { max: 80 }),
        },
        { label: "Контакты" },
      ),
      audit: obj(
        {
          hours: text("Аудит делаем за, часов", { max: 20, hint: "Переменная {аудит_часы}." }),
          problems: text("Сколько проблем находим", { max: 20, hint: "Переменная {аудит_проблемы}." }),
        },
        { label: "Бесплатный аудит" },
      ),
      legal: obj(
        {
          owner: text("ФИО владельца", { max: 120, hint: "В подвале и документах. Переменная {владелец}." }),
          inn: text("ИНН", { max: 20 }),
          year: text("Год в подвале", { max: 20 }),
        },
        { label: "Реквизиты" },
      ),
    }),
  },
  {
    key: "regions",
    title: "Регионы",
    group: "main",
    description:
      "Поддомены для поиска по регионам: kazan.<домен>. Весь контент сайта общий — у региона свой город (переменные {город}, {город_им}, {город_род}) и мета-теги: свои, из общего шаблона или как на основном домене.",
    schema: obj({
      main: obj(cityFields, { label: "Основной домен" }),
      template: obj(regionSeoFields("Пустое поле — как на основном домене."), {
        label: "Шаблоны мета-тегов для всех регионов",
        hint: "Нужны, только если на поддоменах тексты должны отличаться от основного домена: там уже есть {город}, и в каждом регионе подставится его город. Свои тексты региона — в его карточке ниже.",
      }),
      items: list(
        "Регионы",
        obj({
          slug: text("Поддомен", {
            format: "slug",
            hint: "kazan → kazan.<домен>. Поддомен должен быть в DNS и сертификате (DEPLOY.md). Меняйте осторожно — старый адрес перестанет работать.",
          }),
          ...cityFields,
          ...regionSeoFields("Пустое поле — из «Шаблонов для всех регионов», а если пусто и там — как на основном домене."),
        }),
        { max: 100, titleKey: "name", itemLabel: "регион" },
      ),
    }),
    check: (data) => {
      const { items, template } = (data ?? {}) as { items?: unknown; template?: { services?: unknown } };
      const errors = uniqueBy(items, "slug", "Поддомен", "items");
      errors.push(...uniqueBy(template?.services, "id", "Услуга", "template.services"));
      if (Array.isArray(items)) {
        items.forEach((r, i) => {
          const region = r as { slug?: string; services?: unknown };
          if (region.slug && RESERVED_SUBDOMAINS.includes(region.slug)) {
            errors.push({ path: `items.${i}.slug`, message: `Поддомен «${region.slug}» занят под служебный` });
          }
          errors.push(...uniqueBy(region.services, "id", "Услуга", `items.${i}.services`));
        });
      }
      return errors;
    },
  },
  {
    key: "team",
    title: "Команда",
    group: "main",
    description: "Люди в блоке «Кто делает ваш сайт» и цифры под ними.",
    schema: obj({
      members: list(
        "Участники",
        obj({
          photo: image("Фото", "photo", { optional: true, hint: "Квадратное фото, лицо по центру." }),
          name: text("Имя и фамилия", { max: 80 }),
          role: text("Роль", { max: 120 }),
          text: area("О человеке", { max: 600 }),
        }),
        { max: 8, titleKey: "name", itemLabel: "участника" },
      ),
      facts: obj(
        {
          projects: text("Проектов запущено", { max: 20 }),
          years: text("Лет в веб-разработке", { max: 20 }),
        },
        { label: "Цифры" },
      ),
    }),
  },
  {
    key: "siteTypes",
    title: "Типы сайтов и цены",
    group: "catalog",
    description: "Тарифы в блоке «Цены» и страницы /sites/<тип>. Порядок здесь = порядок на сайте.",
    schema: list(
      "Типы сайтов",
      obj({
        id: key("Код"),
        title: text("Название", { max: 60 }),
        price: num("Цена от, ₽", { min: 0, max: 100_000_000, integer: true, hint: "Подставляется в переменную {цена_…} и квиз." }),
        days: text("Срок, дней", { max: 20, hint: "Число: 7. Можно плейсхолдер: [7]." }),
        daysWord: select("Слово после срока", [
          { value: "дней", label: "дней" },
          { value: "дня", label: "дня" },
          { value: "день", label: "день" },
        ]),
        popular: bool("Отметить «Популярный»"),
        description: area("Коротко (в карточке тарифа)", { max: 200 }),
        features: lines("Что входит", { max: 12, itemMax: 120 }),
        cta: text("Текст кнопки", { max: 40 }),
        summary: area("Подзаголовок страницы типа", { max: 400 }),
        purpose: { ...titleText, label: "Для чего нужен" },
        audience: lines("Кому подходит", { max: 10, itemMax: 200 }),
        alternatives: list(
          "Когда выбрать другое",
          obj({ when: text("Когда", { max: 200 }), id: select("Какой тип", planOptions) }),
          { max: 4, titleKey: "when", itemLabel: "вариант" },
        ),
      }),
      { max: 5, min: 5, fixed: true, titleKey: "title" },
    ),
    check: (data) => {
      const ids = Array.isArray(data) ? data.map((t) => (t as { id?: string }).id) : [];
      const ok = ids.length === PLAN_IDS.length && PLAN_IDS.every((id) => ids.includes(id));
      return ok ? [] : [{ path: "", message: "Набор типов сайтов изменился — обновите страницу" }];
    },
  },
  {
    key: "services",
    title: "Услуги",
    group: "catalog",
    description: "Блок «Что мы делаем», страница /services и страницы каждой услуги.",
    schema: list(
      "Услуги",
      obj({
        id: text("Адрес страницы", { format: "slug", hint: "Страница будет /services/<адрес>. Латиница и дефис. Меняйте осторожно — старая ссылка перестанет работать." }),
        title: text("Название", { max: 80 }),
        audience: text("Для кого", { max: 200 }),
        items: list("Пункты на главной", obj({ name: text("Название", { max: 60 }), text: text("Пояснение", { max: 200 }) }), {
          max: 6,
          titleKey: "name",
          itemLabel: "пункт",
        }),
        price: text("Стоимость", { max: 60, hint: "Например «от 30 000 ₽» или переменная {цена_лендинг}." }),
        includes: lines("Что входит", { max: 12, itemMax: 200 }),
        showSiteTypes: bool("Показывать ссылки на типы сайтов"),
        summary: area("Подзаголовок страницы услуги", { max: 500 }),
        benefits: { ...titleText, label: "Что это даёт" },
        signs: lines("Когда это нужно", { max: 10, itemMax: 200 }),
        process: list("Как проходит работа", obj({ title: text("Этап", { max: 80 }), text: area("Описание", { max: 400 }) }), {
          max: 10,
          titleKey: "title",
          itemLabel: "этап",
        }),
        faq: faqList("Вопросы об услуге", 10),
        seo: obj({ title: text("Заголовок для поиска", { max: 90 }), description: area("Описание для поиска", { max: 300 }) }, { label: "Поиск" }),
        cta: obj(
          {
            label: text("Текст кнопки", { max: 40 }),
            section: select("Куда ведёт", [
              { value: "contact", label: "К форме заявки" },
              { value: "quiz", label: "К калькулятору" },
            ]),
            lead: select(
              "Открыть форму",
              [
                { value: "new", label: "Заявка на новый сайт" },
                { value: "audit", label: "Заявка на аудит" },
              ],
              { optional: true, hint: "Если выбрано — кнопка открывает окно с формой." },
            ),
          },
          { label: "Кнопка" },
        ),
      }),
      { max: 12, titleKey: "title", itemLabel: "услугу" },
    ),
    check: (data) => uniqueBy(data, "id", "Адрес"),
  },
  {
    key: "cases",
    title: "Кейсы",
    group: "catalog",
    description: "Работы в портфолио. На главной — первые несколько (сколько — в блоке главной «Наши работы»).",
    schema: list(
      "Кейсы",
      obj({
        title: text("Название", { max: 100 }),
        slug: text("Адрес страницы", {
          format: "slug",
          optional: true,
          hint: "Нужен для подробной страницы /cases/<адрес>. Без него карточка не открывается.",
        }),
        image: image("Превью", "preview", { optional: true, hint: "Будет обрезано до квадрата 600×600." }),
        task: area("Задача (коротко)", { max: 300 }),
        result: area("Результат (коротко)", { max: 300 }),
        description: area("Описание для поиска", { max: 300, optional: true, hint: "120–160 символов. Без него — задача + результат." }),
        url: text("Ссылка на сайт", { format: "url", hint: "https://… или [плейсхолдер] — тогда кнопка неактивна." }),
        beforeAfter: obj(
          { before: image("До", "picture", { optional: true }), after: image("После", "picture", { optional: true }) },
          { toggle: "Слайдер «до/после» вместо превью" },
        ),
        details: obj(
          {
            client: area("Клиент", { max: 300 }),
            tags: lines("Что делали (метки)", { max: 10, itemMax: 40 }),
            facts: list("Цифры", obj({ value: text("Значение", { max: 30 }), label: text("Подпись", { max: 80 }) }), {
              max: 4,
              titleKey: "value",
              itemLabel: "цифру",
            }),
            task: lines("Задача — абзацы", { max: 6, itemMax: 1200, multiline: true }),
            done: lines("Что сделали", { max: 15, itemMax: 300 }),
            result: lines("Результат — абзацы", { max: 6, itemMax: 1200, multiline: true }),
            screenshot: screenshot("Скриншот сайта целиком", { optional: true, hint: "Длинный скриншот, ширина до 1800 px." }),
          },
          { toggle: "Подробная страница кейса" },
        ),
      }),
      { max: 50, titleKey: "title", itemLabel: "кейс" },
    ),
    check: (data) => {
      const errors = uniqueBy(data, "slug", "Адрес");
      if (Array.isArray(data)) {
        data.forEach((c, i) => {
          const item = c as { slug?: string; details?: unknown };
          if (item.details && !item.slug) errors.push({ path: `${i}.slug`, message: "Для подробной страницы нужен адрес" });
        });
      }
      return errors;
    },
  },
  {
    key: "faq",
    title: "Вопросы и ответы",
    group: "catalog",
    description: "Страница /faq. На главной — первые несколько (сколько — в блоке главной «Частые вопросы»).",
    schema: faqList("Вопросы", 40),
    check: (data) => uniqueBy(data, "q", "Вопрос"),
  },
  {
    key: "quiz",
    title: "Калькулятор стоимости",
    group: "catalog",
    description: "Квиз «Узнайте стоимость»: тексты вопросов и надбавки. Цена тарифа берётся из «Типов сайтов».",
    schema: obj({
      texts: obj(
        {
          title: text("Заголовок", { max: 120 }),
          lead: area("Подзаголовок", { max: 300 }),
          multipleHint: text("Подсказка «можно несколько»", { max: 60 }),
          resultTitle: text("Перед ценой", { max: 60 }),
          noRangeTitle: text("Если тип сайта не выбран", { max: 120 }),
          included: text("Надбавка входит в тариф", { max: 40 }),
          formLead: area("Текст над формой", { max: 300 }),
          channelLegend: text("Подпись выбора канала", { max: 60 }),
          contactLabel: text("Подпись поля контакта", { max: 40 }),
          submit: text("Кнопка отправки", { max: 40 }),
          fine: text("Мелкий текст под формой", { max: 120 }),
        },
        { label: "Тексты" },
      ),
      questions: list(
        "Вопросы",
        obj({
          id: key("Код"),
          title: text("Вопрос", { max: 120 }),
          options: list(
            "Варианты ответа",
            obj({
              value: key("Код"),
              label: text("Вариант", { max: 120 }),
              short: text("Коротко — в расшифровке цены", { max: 60, optional: true }),
            }),
            { max: 10, fixed: true, titleKey: "label" },
          ),
        }),
        { max: 5, min: 5, fixed: true, titleKey: "title" },
      ),
      pricing: obj(
        {
          surcharges: obj(
            Object.fromEntries(
              (
                [
                  ["redesign", "Редизайн"],
                  ["migration", "Перенос сайта"],
                  ["copywriting", "Продающие тексты"],
                  ["seo", "SEO и семантика"],
                  ["crm", "CRM или 1С"],
                  ["payment", "Онлайн-оплата"],
                  ["customFeatures", "Нестандартные функции"],
                ] as const
              ).map(([id, label]) => [
                id,
                obj(
                  Object.fromEntries(
                    PLAN_IDS.map((plan) => [plan, num(planOptions.find((o) => o.value === plan)!.label, { min: 0, max: 10_000_000, integer: true })]),
                  ),
                  { label: `${label}, ₽`, hint: "0 — уже входит в тариф." },
                ),
              ]),
            ),
            { label: "Надбавки по тарифам" },
          ),
          design: obj(
            {
              simple: num("Простой", { min: 1, max: 5, step: 0.05 }),
              custom: num("Под бренд", { min: 1, max: 5, step: 0.05 }),
              premium: num("Премиальный", { min: 1, max: 5, step: 0.05 }),
            },
            { label: "Множитель цены тарифа за дизайн", hint: "1.1 = +10 %." },
          ),
          rush: num("Множитель за срочность", { min: 1, max: 5, step: 0.05, hint: "1.2 = +20 % ко всей сумме." }),
          rangeSpread: num("Разброс «от — до», %", { min: 0, max: 200, integer: true }),
        },
        { label: "Расчёт" },
      ),
    }),
  },

  /* Блоки главной */

  block("blocks.hero", "Первый экран", {
    title: text("Заголовок", { max: 120 }),
    titleAccent: text("Выделенная часть заголовка", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    badges: lines("Плашки", { max: 5, itemMax: 120 }),
    primaryCta: text("Главная кнопка (калькулятор)", { max: 40 }),
    secondaryCta: text("Вторая кнопка (к блоку «Почему»)", { max: 40 }),
    note: text("Текст под кнопками", { max: 160 }),
    scrollHint: text("Подсказка «листайте»", { max: 30 }),
  }),
  block("blocks.why", "Почему дешевле", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 600 }),
    aiTitle: text("Колонка AI — заголовок", { max: 60 }),
    aiTasks: lines("Колонка AI — пункты", { max: 8, itemMax: 120 }),
    humanTitle: text("Колонка «люди» — заголовок", { max: 60 }),
    humanTasks: lines("Колонка «люди» — пункты", { max: 8, itemMax: 120 }),
    summary: area("Вывод под колонками", { max: 400 }),
    compareTitle: text("Заголовок таблицы", { max: 60 }),
    columns: obj(
      { freelancer: text("Колонка 1", { max: 30 }), studio: text("Колонка 2", { max: 30 }), us: text("Колонка «мы»", { max: 30 }) },
      { label: "Колонки таблицы" },
    ),
    rows: list(
      "Строки таблицы",
      obj({
        label: text("Что сравниваем", { max: 60 }),
        freelancer: text("Колонка 1", { max: 80 }),
        studio: text("Колонка 2", { max: 80 }),
        us: text("Мы", { max: 120 }),
      }),
      { max: 10, titleKey: "label", itemLabel: "строку" },
    ),
    cta: text("Кнопка", { max: 60 }),
  }),
  block("blocks.forWhom", "Для кого", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    tiles: list(
      "Карточки",
      obj({
        title: text("Кому", { max: 60 }),
        pain: text("Проблема", { max: 160 }),
        solution: area("Решение", { max: 400 }),
        price: text("Цена", { max: 80, hint: "Например {цена_лендинг}." }),
        linkLabel: text("Текст ссылки", { max: 60 }),
        link: select("Куда ведёт ссылка", LINK_TARGETS),
      }),
      { max: 8, titleKey: "title", itemLabel: "карточку" },
    ),
    ctaText: text("Текст внизу", { max: 200 }),
    ctaButton: text("Кнопка внизу", { max: 40 }),
  }),
  block("blocks.services", "Что мы делаем", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    moreLabel: text("Ссылка «подробнее»", { max: 30 }),
    nicheTitle: text("Широкая карточка — заголовок", { max: 80 }),
    nicheText: area("Широкая карточка — текст", { max: 300 }),
    nicheCta: text("Широкая карточка — кнопка", { max: 40 }),
    allText: text("Текст внизу", { max: 200 }),
    allButton: text("Кнопка «все услуги»", { max: 40 }),
  }, "Сами услуги — в разделе «Услуги»."),
  block("blocks.pricing", "Цены", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    popularBadge: text("Плашка популярного тарифа", { max: 30 }),
    moreLabel: text("Ссылка «подробнее»", { max: 30 }),
    ctaText: text("Текст внизу", { max: 200 }),
    ctaButton: text("Кнопка внизу", { max: 40 }),
  }, "Сами тарифы — в разделе «Типы сайтов и цены»."),
  block("blocks.cases", "Наши работы", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    homeCount: num("Сколько кейсов показывать", { min: 1, max: 12, integer: true }),
    ctaText: text("Текст внизу", { max: 200 }),
    allButton: text("Кнопка «все кейсы»", { max: 40 }),
    discussButton: text("Кнопка заявки", { max: 40 }),
  }, "Сами кейсы — в разделе «Кейсы»."),
  block("blocks.process", "Как мы работаем", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    steps: list(
      "Этапы",
      obj({ title: text("Этап", { max: 60 }), text: area("Описание", { max: 400 }), term: text("Срок", { max: 40 }) }),
      { max: 10, titleKey: "title", itemLabel: "этап" },
    ),
    paymentTitle: text("Оплата — выделенное начало", { max: 60 }),
    paymentText: area("Оплата — текст", { max: 400 }),
    note: text("Примечание", { max: 200 }),
    cta: text("Кнопка", { max: 60 }),
  }),
  block("blocks.team", "Команда", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 600 }),
    projectsLabel: text("Подпись к числу проектов", { max: 40 }),
    yearsLabel: text("Подпись к числу лет", { max: 40 }),
    cta: text("Кнопка", { max: 40 }),
  }, "Люди и цифры — в разделе «Команда»."),
  block("blocks.guarantees", "Гарантии", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    items: list(
      "Гарантии",
      obj({
        icon: select("Иконка", [
          { value: "contract", label: "Договор" },
          { value: "lock", label: "Замок" },
          { value: "calendar", label: "Календарь" },
          { value: "steps", label: "Ступени" },
          { value: "revisions", label: "Правки" },
          { value: "key", label: "Ключ" },
          { value: "support", label: "Поддержка" },
        ]),
        title: text("Заголовок", { max: 80 }),
        text: area("Текст", { max: 600 }),
      }),
      { max: 10, titleKey: "title", itemLabel: "гарантию" },
    ),
    cta: text("Кнопка", { max: 40 }),
  }),
  block("blocks.faq", "Частые вопросы", {
    title: text("Заголовок", { max: 120 }),
    homeCount: num("Сколько вопросов показывать", { min: 1, max: 20, integer: true }),
    allButton: text("Кнопка «все вопросы»", { max: 40 }),
    askButton: text("Кнопка «задать вопрос»", { max: 60 }),
  }, "Сами вопросы — в разделе «Вопросы и ответы»."),
  block("blocks.contact", "Контакты (формы)", {
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 300 }),
    newTitle: text("Форма «новый сайт» — заголовок", { max: 80 }),
    newText: area("Форма «новый сайт» — текст", { max: 300 }),
    newSubmit: text("Форма «новый сайт» — кнопка", { max: 40 }),
    auditTitle: text("Форма «аудит» — заголовок", { max: 80 }),
    auditText: area("Форма «аудит» — текст", { max: 300 }),
    auditSubmit: text("Форма «аудит» — кнопка", { max: 40 }),
    fine: text("Мелкий текст", { max: 200 }),
  }),
  {
    key: "layout",
    title: "Шапка и подвал",
    group: "pages",
    description: "Меню, кнопка в шапке, подвал. Контакты — в разделе «Контакты и реквизиты».",
    schema: obj({
      menu: obj(
        {
          services: text("Услуги", { max: 30 }),
          sites: text("Типы сайтов", { max: 30 }),
          cases: text("Кейсы", { max: 30 }),
          faq: text("Вопросы", { max: 30 }),
          contact: text("Контакты", { max: 30 }),
        },
        { label: "Пункты меню" },
      ),
      cta: text("Кнопка в шапке и подвале", { max: 40 }),
      footer: obj(
        {
          about: area("О компании", { max: 300 }),
          navTitle: text("Заголовок «Навигация»", { max: 40 }),
          servicesTitle: text("Заголовок «Услуги»", { max: 40 }),
          servicesLinks: list(
            "Ссылки в колонке «Услуги»",
            obj({ label: text("Текст", { max: 60 }), href: text("Страница", { format: "path", placeholder: "/services/seo" }) }),
            { max: 10, titleKey: "label", itemLabel: "ссылку" },
          ),
          contactsTitle: text("Заголовок «Контакты»", { max: 40 }),
          workHoursLabel: text("Перед часами работы", { max: 40 }),
          selfEmployed: text("Строка с реквизитами", { max: 200 }),
          privacyLink: text("Ссылка на политику", { max: 80 }),
          consentLink: text("Ссылка на согласие", { max: 80 }),
        },
        { label: "Подвал" },
      ),
    }),
  },
  {
    key: "forms",
    title: "Формы заявок",
    group: "pages",
    description: "Окно заявки, подписи полей, сообщение после отправки.",
    schema: obj({
      modal: obj(
        {
          newTab: text("Вкладка 1", { max: 30 }),
          newTitle: text("Вкладка 1 — заголовок", { max: 80 }),
          newText: area("Вкладка 1 — текст", { max: 300 }),
          newSubmit: text("Вкладка 1 — кнопка", { max: 40 }),
          auditTab: text("Вкладка 2", { max: 30 }),
          auditTitle: text("Вкладка 2 — заголовок", { max: 80 }),
          auditText: area("Вкладка 2 — текст", { max: 300 }),
          auditSubmit: text("Вкладка 2 — кнопка", { max: 40 }),
          fine: text("Мелкий текст", { max: 200 }),
        },
        { label: "Окно заявки" },
      ),
      fields: obj(
        {
          url: text("Ссылка на сайт", { max: 40 }),
          name: text("Имя", { max: 40 }),
          contact: text("Контакт", { max: 60 }),
          contactPlaceholder: text("Подсказка в поле контакта", { max: 40 }),
          channel: text("Выбор канала связи", { max: 60 }),
          task: text("О задаче", { max: 60 }),
        },
        { label: "Подписи полей" },
      ),
      consentText: text("Согласие — текст", { max: 200 }),
      consentLink: text("Согласие — ссылка на политику", { max: 80 }),
      success: area("После отправки", { max: 300 }),
      sendError: text("Если не отправилось", { max: 200 }),
    }),
  },
  page("pages.home", "Главная (поиск)", "Заголовок и описание главной для поиска и превью ссылок.", {
    ...seo("Полностью, вместе с названием: «… — {название}»."),
  }),
  page("pages.services", "Страница «Услуги»", "Страница /services. Сами услуги — в разделе «Услуги».", {
    ...seo(),
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    priceLabel: text("Перед ценой", { max: 30 }),
    includesTitle: text("Заголовок «что входит»", { max: 40 }),
    allTypes: text("Ссылка на все типы сайтов", { max: 40 }),
    ctaText: text("Текст внизу", { max: 200 }),
    casesButton: text("Кнопка «работы»", { max: 40 }),
    discussButton: text("Кнопка заявки", { max: 40 }),
  }),
  page("pages.service", "Страница услуги", "Заголовки на страницах /services/<услуга>.", {
    benefitsTitle: text("«Что это даёт»", { max: 60 }),
    signsTitle: text("«Когда это нужно»", { max: 60 }),
    includesTitle: text("«Что входит»", { max: 60 }),
    typesTitle: text("«Какой сайт вам нужен»", { max: 60 }),
    compareTypes: text("Ссылка «сравнить типы»", { max: 60 }),
    processTitle: text("«Как проходит работа»", { max: 60 }),
    faqTitle: text("«Частые вопросы»", { max: 60 }),
    allServices: text("Ссылка «все услуги»", { max: 40 }),
    ctaText: text("Текст внизу", { max: 200 }),
    casesButton: text("Кнопка «работы»", { max: 40 }),
    discussButton: text("Кнопка заявки", { max: 40 }),
  }),
  page("pages.sites", "Страница «Типы сайтов»", "Страница /sites. Сами типы — в разделе «Типы сайтов и цены».", {
    ...seo(),
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    audienceTitle: text("«Кому подходит»", { max: 40 }),
    moreLabel: text("Ссылка «подробнее»", { max: 30 }),
    pickTitle: text("Карточка-подсказка — заголовок", { max: 60 }),
    pickText: area("Карточка-подсказка — текст", { max: 300 }),
    pickQuiz: text("Карточка-подсказка — кнопка калькулятора", { max: 40 }),
    pickDiscuss: text("Карточка-подсказка — кнопка заявки", { max: 40 }),
  }),
  page("pages.siteType", "Страница типа сайта", "Заголовки на страницах /sites/<тип>. Здесь работают ещё {тип} и {цена}.", {
    seoTitle: text("Заголовок для поиска", { max: 120, hint: "Например «Заказать {тип} под ключ {цена} — {название}»." }),
    seoDescription: area("Описание для поиска", { max: 300, optional: true, hint: "Здесь работают {тип} и {цена}. Пусто — подзаголовок типа сайта." }),
    termPrefix: text("Перед сроком", { max: 20 }),
    calcButton: text("Кнопка калькулятора", { max: 40 }),
    purposeTitle: text("«Для чего нужен {тип}»", { max: 80 }),
    audienceTitle: text("«Кому подходит»", { max: 60 }),
    featuresTitle: text("«Что входит»", { max: 60 }),
    alternativesTitle: text("«Когда выбрать другое»", { max: 60 }),
    allTypes: text("Ссылка «все типы»", { max: 40 }),
    ctaText: text("Текст внизу", { max: 200 }),
    casesButton: text("Кнопка «работы»", { max: 40 }),
    discussButton: text("Кнопка заявки", { max: 40 }),
  }),
  page("pages.cases", "Страница «Кейсы»", "Страница /cases, карточки и подробная страница кейса. Здесь работает ещё {кейс}.", {
    ...seo(),
    title: text("Заголовок", { max: 120 }),
    lead: area("Подзаголовок", { max: 400 }),
    ctaText: text("Текст внизу", { max: 200 }),
    discussButton: text("Кнопка заявки", { max: 40 }),
    cardTask: text("Карточка — перед задачей", { max: 30 }),
    cardResult: text("Карточка — перед результатом", { max: 30 }),
    cardMore: text("Карточка — кнопка «подробнее»", { max: 40 }),
    viewSite: text("Кнопка «посмотреть сайт»", { max: 40 }),
    caseSeoTitle: text("Кейс — заголовок для поиска", { max: 120, hint: "Например «Кейс: {кейс} — {название}»." }),
    detailTask: text("Кейс — «Задача»", { max: 40 }),
    detailDone: text("Кейс — «Что сделали»", { max: 40 }),
    detailResult: text("Кейс — «Результат»", { max: 40 }),
    detailCta: text("Кейс — текст внизу", { max: 200 }),
  }),
  page("pages.faq", "Страница «Вопросы»", "Страница /faq. Сами вопросы — в разделе «Вопросы и ответы».", {
    ...seo(),
    title: text("Заголовок", { max: 120 }),
  }),
  legalDoc("privacy", "Политика конфиденциальности"),
  legalDoc("consent", "Согласие на обработку данных"),
];

function block(key: string, title: string, fields: Record<string, Field>, note?: string): SectionDef {
  return {
    key,
    title,
    group: "home",
    description: `Тексты блока «${title}» на главной.${note ? ` ${note}` : ""}`,
    schema: obj(fields),
  };
}

function page(key: string, title: string, description: string, fields: Record<string, Field>): SectionDef {
  return { key, title, group: "pages", description, schema: obj(fields) };
}

function legalDoc(key: string, title: string): SectionDef {
  return {
    key,
    title,
    group: "docs",
    description: "Юридический документ. Перед публикацией покажите юристу.",
    schema: obj({
      title: text("Заголовок", { max: 120 }),
      seoDescription: area("Описание для поиска", { max: 300 }),
      lead: area("Коротко", { max: 400 }),
      sections: list(
        "Разделы",
        obj({
          title: text("Заголовок раздела", { max: 120 }),
          text: lines("Абзацы", { max: 10, itemMax: 2000, multiline: true }),
          list: lines("Список", { max: 15, itemMax: 500 }),
        }),
        { max: 20, titleKey: "title", itemLabel: "раздел" },
      ),
    }),
  };
}

export const SECTION_MAP = new Map(SECTIONS.map((s) => [s.key, s]));

export function getSection(key: string): SectionDef | undefined {
  return SECTION_MAP.get(key);
}

export type { ObjectField };
