/** Заявки с квиза и форм. */

export type Channel = "telegram" | "whatsapp" | "call" | "email";

export const channels: { value: Channel; label: string; placeholder: string }[] = [
  { value: "telegram", label: "Telegram", placeholder: "@ник или номер телефона" },
  { value: "whatsapp", label: "WhatsApp", placeholder: "Номер телефона" },
  { value: "call", label: "Звонок", placeholder: "Номер телефона" },
  { value: "email", label: "E-mail", placeholder: "E-mail" },
];

const PHONE = /^\+?[\d\s()-]{10,20}$/;
const TG_NICK = /^@?[a-zA-Z0-9_]{5,32}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Проверка контакта под выбранный канал. Возвращает текст ошибки или null. */
export function validateContact(channel: Channel | undefined, value: string): string | null {
  const v = value.trim();
  if (!v) return "Укажите, как с вами связаться";
  const digits = v.replace(/\D/g, "");
  const isPhone = PHONE.test(v) && digits.length >= 10 && digits.length <= 15;
  switch (channel) {
    case "email":
      return EMAIL.test(v) ? null : "Проверьте e-mail";
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
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.hostname.includes(".") ? null : "Проверьте ссылку";
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
  console.info("[lead]", lead);
  await new Promise((resolve) => setTimeout(resolve, 600));
}
