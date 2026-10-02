import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { DEFAULTS } from "@/content/defaults";
import { fillDeep, validate, type ValidationError } from "@/content/schema";
import { getSection, planVarName, SECTIONS } from "@/content/sections";
import type { City, Pages, Region, RegionSeoTexts, RegionsContent, SiteContent } from "@/content/types";
import type { RegionLink } from "@/lib/clientContent";
import { fromPrice, plansOf } from "@/lib/format";
import { query, queryOne, transaction } from "./db";

/**
 * Контент сайта из таблицы content. Все разделы держим в памяти процесса и перечитываем,
 * только когда в базе что-то изменилось (проверка — не чаще раза в 2 секунды, один лёгкий запрос).
 * Кэш — в globalThis: у каждого маршрута Next свой экземпляр модуля, а данные должны быть общими.
 * Если база недоступна — отдаём последнее загруженное, а без него — значения по умолчанию из content/*.json.
 *
 * Регионы: сайт отвечает и на поддоменах kazan.<домен>. Контент везде один, у региона — свой город
 * в переменных, свои мета-теги и адрес сайта (canonical, sitemap, разметка). Регион — по заголовку Host.
 */

const CHECK_INTERVAL_MS = 2000;

interface Snapshot {
  stamp: string;
  checkedAt: number;
  raw: Record<string, unknown>;
  regions: RegionsContent;
  /** Собранный контент по поддоменам, "" — основной домен. Собирается при первом запросе. */
  built: Map<string, SiteContent>;
}

const g = globalThis as typeof globalThis & { __wlContent?: Snapshot; __wlContentLoad?: Promise<Snapshot> };

async function readStamp(): Promise<string> {
  const row = await queryOne<{ stamp: string }>(
    "SELECT coalesce(max(updated_at)::text, '') || ':' || count(*)::text || ':' || coalesce(sum(version), 0)::text AS stamp FROM content",
  );
  return row?.stamp ?? "";
}

function makeSnapshot(stamp: string, raw: Record<string, unknown>): Snapshot {
  const stored = raw.regions as Partial<RegionsContent> | undefined;
  const fallback = DEFAULTS.regions as RegionsContent;
  const regions = {
    main: stored?.main ?? fallback.main,
    template: stored?.template ?? fallback.template,
    items: Array.isArray(stored?.items) ? stored.items : [],
  };
  return { stamp, checkedAt: Date.now(), raw, regions, built: new Map() };
}

async function loadSnapshot(stamp: string): Promise<Snapshot> {
  const rows = await query<{ key: string; data: unknown }>("SELECT key, data FROM content");
  const stored = new Map(rows.map((r) => [r.key, r.data]));
  return makeSnapshot(stamp, Object.fromEntries(SECTIONS.map((s) => [s.key, stored.get(s.key) ?? DEFAULTS[s.key]])));
}

async function getSnapshot(): Promise<Snapshot> {
  const cached = g.__wlContent;
  if (cached && Date.now() - cached.checkedAt < CHECK_INTERVAL_MS) return cached;
  try {
    const stamp = await readStamp();
    if (cached && cached.stamp === stamp) {
      cached.checkedAt = Date.now();
      return cached;
    }
    // Несколько запросов одновременно — одна загрузка
    g.__wlContentLoad ??= loadSnapshot(stamp).finally(() => {
      g.__wlContentLoad = undefined;
    });
    g.__wlContent = await g.__wlContentLoad;
    return g.__wlContent;
  } catch (err) {
    console.error("[content] база недоступна:", (err as Error).message);
    if (cached) {
      cached.checkedAt = Date.now();
      return cached;
    }
    return makeSnapshot("", DEFAULTS);
  }
}

/**
 * Какой регион открыт: поддомен из списка — его slug, основной домен (и www) — null,
 * неизвестный поддомен основного домена — undefined. Локально работают поддомены localhost: kazan.localhost:3000.
 */
export function matchRegion(host: string, siteUrl: string, slugs: Iterable<string>): string | null | undefined {
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  let main = "";
  try {
    main = new URL(siteUrl).hostname.replace(/^www\./, "");
  } catch {
    // адрес сайта не заполнен — регионы работают только на localhost
  }
  const known = new Set(slugs);
  for (const base of [main, "localhost"]) {
    if (!base) continue;
    if (hostname === base || hostname === `www.${base}`) return null;
    if (hostname.endsWith(`.${base}`)) {
      const sub = hostname.slice(0, -base.length - 1);
      return known.has(sub) ? sub : undefined;
    }
  }
  return null;
}

/** https://example.com + kazan → https://kazan.example.com */
export function regionUrl(siteUrl: string, slug: string): string {
  try {
    const url = new URL(siteUrl);
    url.hostname = `${slug}.${url.hostname.replace(/^www\./, "")}`;
    return url.origin;
  } catch {
    return siteUrl;
  }
}

interface RequestContent {
  content: SiteContent;
  /** Открыт поддомен, которого нет в списке регионов. */
  unknownHost: boolean;
  regionLinks: RegionLink[];
}

/**
 * Ссылки на все города: основной домен и поддомены. Локально (localhost, kazan.localhost) — на localhost
 * с тем же портом, чтобы переключение работало при разработке; на сервере — на домен из адреса сайта.
 */
function regionLinksOf(host: string, siteUrl: string, regions: RegionsContent): RegionLink[] {
  if (!regions.items.length) return [];
  const local = /(^|\.)localhost(:\d+)?$/i.test(host);
  let base = siteUrl.replace(/\/$/, "");
  if (local) base = `http://localhost${host.match(/:\d+$/)?.[0] ?? ""}`;
  else {
    try {
      base = new URL(siteUrl).origin;
    } catch {
      // адрес сайта не заполнен — ссылки как есть
    }
  }
  return [
    { slug: null, name: regions.main.name, url: base },
    ...regions.items.map((r) => ({ slug: r.slug, name: r.name, url: regionUrl(base, r.slug) })),
  ];
}

const getRequestContent = cache(async (): Promise<RequestContent> => {
  const snapshot = await getSnapshot();
  const host = (await headers()).get("host") ?? "";
  const site = snapshot.raw.site as SiteContent["site"];
  const slug = matchRegion(host, site.url, snapshot.regions.items.map((r) => r.slug));
  const region = slug ? snapshot.regions.items.find((r) => r.slug === slug) : undefined;
  const key = region?.slug ?? "";
  let content = snapshot.built.get(key);
  if (!content) {
    content = assemble(snapshot.raw, snapshot.regions, region);
    snapshot.built.set(key, content);
  }
  return { content, unknownHost: slug === undefined, regionLinks: regionLinksOf(host, site.url, snapshot.regions) };
});

/** Весь контент сайта для текущего региона с подставленными переменными. Один раз на запрос. */
export const getContent = async (): Promise<SiteContent> => (await getRequestContent()).content;

/** Открыт неизвестный поддомен — layout сайта уводит на основной домен. */
export const isUnknownHost = async (): Promise<boolean> => (await getRequestContent()).unknownHost;

/** Города для переключателя в шапке. */
export const getRegionLinks = async (): Promise<RegionLink[]> => (await getRequestContent()).regionLinks;

/** Сбросить кэш после сохранения: следующий запрос перечитает базу. */
export function invalidateContent() {
  if (g.__wlContent) g.__wlContent.checkedAt = 0;
}

/** Переменные для текстов: {срок_ответа}, {цена_лендинг}, {город} и т.д. */
export function variablesOf(site: SiteContent["site"], siteTypes: SiteContent["siteTypes"], city: City): Record<string, string> {
  const vars: Record<string, string> = {
    название: site.name,
    срок_ответа: String(site.responseMinutes),
    дни_поддержки: String(site.supportDays),
    аудит_часы: site.audit.hours,
    аудит_проблемы: site.audit.problems,
    город: city.namePrep,
    город_им: city.name,
    город_род: city.nameGen,
    телефон: site.contacts.phone,
    email: site.contacts.email,
    владелец: site.legal.owner,
    инн: site.legal.inn,
    год: site.legal.year,
  };
  const plans = plansOf(siteTypes);
  for (const t of siteTypes) {
    const name = planVarName(t.id);
    vars[`цена_${name}`] = fromPrice(t.price);
    vars[`срок_${name}`] = plans[t.id].term;
    vars[`дни_${name}`] = plans[t.id].days;
  }
  return vars;
}

/** Только заполненные поля: пустое поле региона не затирает текст основного домена. */
const filled = <T extends object>(o: T | undefined): Partial<T> =>
  Object.fromEntries(Object.entries(o ?? {}).filter(([, v]) => typeof v === "string" && v.trim())) as Partial<T>;

/**
 * Контент для основного домена или региона. Мета-теги региона: свои → шаблон для всех регионов → основной домен.
 */
function assemble(raw: Record<string, unknown>, regions: RegionsContent, region?: Region): SiteContent {
  const r = raw as Record<string, never>;
  const baseSite = r.site as SiteContent["site"];
  const site = region ? { ...baseSite, url: regionUrl(baseSite.url, region.slug) } : baseSite;
  const siteTypes = r.siteTypes as SiteContent["siteTypes"];
  const layers = region ? [regions.template, region] : [];
  const page = <K extends keyof Pages>(key: K): Pages[K] =>
    Object.assign({}, r[`pages.${key}`] as Pages[K], ...layers.map((l) => filled(l.seo?.[key as keyof RegionSeoTexts["seo"]])));
  const services = (r.services as SiteContent["services"]).map((service) => {
    const overrides = layers.map((l) => filled(l.services?.find((s) => s.id === service.id)));
    return { ...service, seo: Object.assign({}, service.seo, ...overrides.map(({ title, description }) => filled({ title, description }))) };
  });
  const city: City = region ?? regions.main;
  const content: SiteContent = {
    site,
    region: { slug: region?.slug ?? null, name: city.name, nameGen: city.nameGen, namePrep: city.namePrep },
    siteTypes,
    team: r.team,
    services,
    cases: r.cases,
    faq: r.faq,
    quiz: r.quiz,
    blocks: {
      hero: r["blocks.hero"],
      why: r["blocks.why"],
      forWhom: r["blocks.forWhom"],
      services: r["blocks.services"],
      pricing: r["blocks.pricing"],
      cases: r["blocks.cases"],
      process: r["blocks.process"],
      team: r["blocks.team"],
      guarantees: r["blocks.guarantees"],
      faq: r["blocks.faq"],
      contact: r["blocks.contact"],
    },
    layout: r.layout,
    forms: r.forms,
    pages: {
      home: page("home"),
      services: page("services"),
      service: page("service"),
      sites: page("sites"),
      siteType: page("siteType"),
      cases: page("cases"),
      faq: page("faq"),
    },
    privacy: r.privacy,
    consent: r.consent,
  };
  return fillDeep(content, variablesOf(site, siteTypes, city));
}

/* Для админки: сырые данные раздела, сохранение с проверкой и историей */

export interface SectionState {
  data: unknown;
  version: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export async function readSection(key: string): Promise<SectionState> {
  const row = await queryOne<{ data: unknown; version: number; updated_at: Date; updated_by: string | null }>(
    `SELECT c.data, c.version, c.updated_at, u.name AS updated_by
     FROM content c LEFT JOIN users u ON u.id = c.updated_by WHERE c.key = $1`,
    [key],
  );
  if (!row) return { data: DEFAULTS[key], version: 0, updatedAt: null, updatedBy: null };
  return { data: row.data, version: row.version, updatedAt: row.updated_at.toISOString(), updatedBy: row.updated_by };
}

export type SaveResult =
  | { ok: true; version: number; data: unknown }
  | { ok: false; errors: ValidationError[] }
  | { ok: false; conflict: true };

/**
 * Проверяет и сохраняет раздел. expectedVersion — версия, которую редактор открыл:
 * если кто-то успел сохранить раньше, правки не затрут друг друга (конфликт).
 * Прошлая версия уходит в историю.
 */
export async function writeSection(key: string, input: unknown, expectedVersion: number, userId: number, note?: string): Promise<SaveResult> {
  const section = getSection(key);
  if (!section) return { ok: false, errors: [{ path: "", message: "Неизвестный раздел" }] };
  const { value, errors } = validate(section.schema, input);
  if (!errors.length) errors.push(...(section.check?.(value) ?? []));
  if (errors.length) return { ok: false, errors };

  const result = await transaction(async (client) => {
    const current = await client.query<{ version: number; data: unknown }>("SELECT version, data FROM content WHERE key = $1 FOR UPDATE", [key]);
    const row = current.rows[0];
    const currentVersion = row?.version ?? 0;
    if (currentVersion !== expectedVersion) return { ok: false as const, conflict: true as const };
    const version = currentVersion + 1;
    const json = JSON.stringify(value);
    if (row) {
      // История хранит все версии, включая текущую. Версию из начального наполнения (её никто не сохранял) добавляем при первой правке.
      await client.query(
        `INSERT INTO content_revisions (key, version, data, note)
         SELECT $1, $2, $3, 'Исходная версия'
         WHERE NOT EXISTS (SELECT 1 FROM content_revisions WHERE key = $1 AND version = $2)`,
        [key, currentVersion, JSON.stringify(row.data)],
      );
      await client.query("UPDATE content SET data = $2, version = $3, updated_at = now(), updated_by = $4 WHERE key = $1", [key, json, version, userId]);
    } else {
      await client.query("INSERT INTO content (key, data, version, updated_by) VALUES ($1, $2, $3, $4)", [key, json, version, userId]);
    }
    await client.query("INSERT INTO content_revisions (key, version, data, created_by, note) VALUES ($1, $2, $3, $4, $5)", [
      key,
      version,
      json,
      userId,
      note ?? null,
    ]);
    return { ok: true as const, version, data: value };
  });
  if (result.ok) invalidateContent();
  return result;
}
