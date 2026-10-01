import "server-only";
import { cache } from "react";
import { DEFAULTS } from "@/content/defaults";
import { fillDeep, validate, type ValidationError } from "@/content/schema";
import { getSection, planVarName, SECTIONS } from "@/content/sections";
import type { SiteContent } from "@/content/types";
import { fromPrice, plansOf } from "@/lib/format";
import { query, queryOne, transaction } from "./db";

/**
 * Контент сайта из таблицы content. Все разделы держим в памяти процесса и перечитываем,
 * только когда в базе что-то изменилось (проверка — не чаще раза в 2 секунды, один лёгкий запрос).
 * Кэш — в globalThis: у каждого маршрута Next свой экземпляр модуля, а данные должны быть общими.
 * Если база недоступна — отдаём последнее загруженное, а без него — значения по умолчанию из content/*.json.
 */

const CHECK_INTERVAL_MS = 2000;

interface Snapshot {
  stamp: string;
  checkedAt: number;
  content: SiteContent;
}

const g = globalThis as typeof globalThis & { __wlContent?: Snapshot; __wlContentLoad?: Promise<Snapshot> };

async function readStamp(): Promise<string> {
  const row = await queryOne<{ stamp: string }>(
    "SELECT coalesce(max(updated_at)::text, '') || ':' || count(*)::text || ':' || coalesce(sum(version), 0)::text AS stamp FROM content",
  );
  return row?.stamp ?? "";
}

async function loadSnapshot(stamp: string): Promise<Snapshot> {
  const rows = await query<{ key: string; data: unknown }>("SELECT key, data FROM content");
  const stored = new Map(rows.map((r) => [r.key, r.data]));
  const raw = Object.fromEntries(SECTIONS.map((s) => [s.key, stored.get(s.key) ?? DEFAULTS[s.key]]));
  return { stamp, checkedAt: Date.now(), content: assemble(raw) };
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
    return { stamp: "", checkedAt: 0, content: assemble(DEFAULTS) };
  }
}

/** Весь контент сайта с подставленными переменными. Один раз на запрос. */
export const getContent = cache(async (): Promise<SiteContent> => (await getSnapshot()).content);

/** Сбросить кэш после сохранения: следующий запрос перечитает базу. */
export function invalidateContent() {
  if (g.__wlContent) g.__wlContent.checkedAt = 0;
}

/** Переменные для текстов: {срок_ответа}, {цена_лендинг} и т.д. */
export function variablesOf(site: SiteContent["site"], siteTypes: SiteContent["siteTypes"]): Record<string, string> {
  const vars: Record<string, string> = {
    название: site.name,
    срок_ответа: String(site.responseMinutes),
    дни_поддержки: String(site.supportDays),
    аудит_часы: site.audit.hours,
    аудит_проблемы: site.audit.problems,
    город: site.city,
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

function assemble(raw: Record<string, unknown>): SiteContent {
  const r = raw as Record<string, never>;
  const site = r.site as SiteContent["site"];
  const siteTypes = r.siteTypes as SiteContent["siteTypes"];
  const content: SiteContent = {
    site,
    siteTypes,
    team: r.team,
    services: r.services,
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
      home: r["pages.home"],
      services: r["pages.services"],
      service: r["pages.service"],
      sites: r["pages.sites"],
      siteType: r["pages.siteType"],
      cases: r["pages.cases"],
      faq: r["pages.faq"],
    },
    privacy: r.privacy,
    consent: r.consent,
  };
  return fillDeep(content, variablesOf(site, siteTypes));
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
