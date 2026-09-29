/** Заявки с квиза и форм. */

import { LIMITS, checkText, sanitize } from "./antispam";

export type Channel = "telegram" | "whatsapp" | "call" | "email";

export const channels: { value: Channel; label: string; placeholder: string }[] = [
  { value: "telegram", label: "Telegram", placeholder: "@ник или номер телефона" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "Номер телефона" },
  { value: "call", label: "Звонок", placeholder: "Номер телефона" },
  { value: "email", label: "E-mail", placeholder: "E-mail" },
];

const PHONE = /^\+?[\d\s()-]{10,20}$/;
const TG_NICK = /^@?[a-zA-Z0-9_]{5,32}$/;
const EMAIL = /^[\p{L}\d._%+-]{1,64}@(?:[\p{L}\d](?:[\p{L}\d-]{0,61}[\p{L}\d])?\.)+[\p{L}]{2,24}$/u;
// Буквы любого алфавита, пробел, дефис, апостроф, точка; начинается с буквы
const NAME = /^\p{L}[\p{L}\p{M} '’.-]*$/u;

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return "Как к вам обращаться?";
  if (v.length < 2) return "Слишком короткое имя";
  return checkText(v, { max: LIMITS.name }) ?? (NAME.test(v) ? null : "Только буквы, пробел и дефис");
}

/** Необязательный комментарий к заявке: до одной ссылки, без разметки. */
export function validateTask(value: string): string | null {
  const v = value.trim();
  return v ? checkText(v, { max: LIMITS.task, maxLinks: 1 }) : null;
}

/** Проверка контакта под выбранный канал. Возвращает текст ошибки или null. */
export function validateContact(channel: Channel | undefined, value: string): string | null {
  const v = value.trim();
  if (!v) return "Укажите, как с вами связаться";
  if (v.length > LIMITS.contact) return `Не больше ${LIMITS.contact} символов`;
  const digits = v.replace(/\D/g, "");
  const isPhone = PHONE.test(v) && digits.length >= 10 && digits.length <= 15;
  switch (channel) {
    case "email":
      return EMAIL.test(v) && !v.includes("..") ? null : "Проверьте e-mail";
    case "telegram":
      return isPhone || TG_NICK.test(v) ? null : "Укажите ник в Telegram или номер телефона";
    case "whatsapp":
    case "call":
      return isPhone ? null : "Проверьте номер телефона";
    default:
      return isPhone || TG_NICK.test(v) ? null : "Укажите телефон или ник в Telegram";
  }
}

export function validateUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return "Укажите ссылку на сайт";
  if (v.length > LIMITS.url) return "Слишком длинная ссылка";
  if (/\s|[<>"'`]/.test(v)) return "Проверьте ссылку";
  // Любая схема, кроме http(s), — сразу нет (javascript:, data:, file: и т.п.)
  if (/^[a-z][a-z\d+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)) return "Нужна ссылка вида https://…";
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (url.username || url.password) return "Ссылка не должна содержать логин и пароль";
    const labels = url.hostname.split(".");
    const tld = labels.at(-1) ?? "";
    const ok = labels.length >= 2 && labels.every(Boolean) && /^(?:[a-z]{2,24}|xn--[a-z\d-]+)$/i.test(tld);
    return ok ? null : "Проверьте ссылку";
  } catch {
    return "Проверьте ссылку";
  }
}

export interface Lead {
  source: "quiz" | "form-new" | "form-audit";
  name?: string;
  contact: string;
  channel?: Channel;
  [key: string]: unknown;
}

/**
 * Отправка заявки.
 * TODO: [указать: Telegram-бот, e-mail, CRM] — сейчас заглушка, заявка только пишется в консоль.
 */
export async function submitLead(lead: Lead): Promise<void> {
  lead = cleanDeep(lead) as Lead;
  console.info("[lead]", lead);
  await new Promise((resolve) => setTimeout(resolve, 600));
}

/** Чистит все строки заявки (включая ответы квиза) перед отправкой. */
function cleanDeep(value: unknown): unknown {
  if (typeof value === "string") return sanitize(value, LIMITS.task, true);
  if (Array.isArray(value)) return value.map(cleanDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [sanitize(k, 200), cleanDeep(v)]));
  }
  return value;
}
