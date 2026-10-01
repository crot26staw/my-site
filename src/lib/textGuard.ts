/**
 * Проверка и очистка текста из форм. Общая для браузера и сервера (src/actions/leads.ts).
 */

export const LIMITS = { name: 60, contact: 100, url: 2048, task: 1000 } as const;

// Управляющие символы, невидимые пробелы и символы смены направления текста (bidi-спуфинг)
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
// Разметка и типовые векторы XSS/инъекций
const DANGEROUS = /<\s*\/?\s*[a-z!?]|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html|\bon[a-z]+\s*=|\{\{|\$\{|<%/i;
const LINK = /(https?:\/\/|www\.)\S+/gi;
// Один символ подряд 10+ раз: «аааааааааа», «!!!!!!!!!!»
const REPEAT = /(.)\1{9,}/u;

/** Чистит строку перед отправкой: невидимые символы, угловые скобки, лишние пробелы, длина. */
export function sanitize(value: string, max: number, multiline = false): string {
  let v = value.normalize("NFKC").replace(INVISIBLE, "").replace(/[<>]/g, "");
  v = multiline
    ? v.replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n")
    : v.replace(/\s+/g, " ");
  return v.trim().slice(0, max);
}

/** Общие проверки свободного текста. Возвращает текст ошибки или null. */
export function checkText(value: string, { max, maxLinks = 0 }: { max: number; maxLinks?: number }): string | null {
  if (value.length > max) return `Не больше ${max} символов`;
  if (DANGEROUS.test(value)) return "Уберите из текста HTML и код";
  if ((value.match(LINK)?.length ?? 0) > maxLinks) return maxLinks ? "Слишком много ссылок" : "Ссылки здесь не нужны";
  if (REPEAT.test(value)) return "Похоже на случайный набор символов";
  return null;
}
