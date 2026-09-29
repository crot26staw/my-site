/**
 * Фронтенд-защита форм от ботов и мусора. Это только первый рубеж:
 * всё то же самое обязательно нужно повторить на сервере, фронтенд обходится за минуту.
 */

import { useCallback, useRef, useState } from "react";

/** Быстрее этого человек форму не заполнит. */
const MIN_FILL_MS = 2500;
/** Пауза между заявками с одного браузера. */
const MIN_INTERVAL_MS = 30_000;
/** Не больше MAX_PER_WINDOW заявок за WINDOW_MS. */
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 60 * 60_000;
const STORAGE_KEY = "leads:sent";

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

function readSent(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((t): t is number => typeof t === "number") : [];
  } catch {
    return [];
  }
}

function rateLimitError(): string | null {
  const now = Date.now();
  const recent = readSent().filter((t) => now - t < WINDOW_MS);
  const last = Math.max(0, ...recent);
  if (now - last < MIN_INTERVAL_MS) {
    return `Заявка уже отправлена. Повторно можно через ${Math.ceil((MIN_INTERVAL_MS - (now - last)) / 1000)} с.`;
  }
  if (recent.length >= MAX_PER_WINDOW) return "Слишком много заявок подряд. Попробуйте позже.";
  return null;
}

function rememberSent() {
  try {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readSent().filter((t) => now - t < WINDOW_MS), now]));
  } catch {
    // приватный режим или запрещённое хранилище: лимит просто не работает
  }
}

export type GuardResult = { ok: true } | { ok: false; bot: true } | { ok: false; bot: false; error: string };

/**
 * Защита одной формы: поле-ловушка, минимальное время заполнения, лимит частоты, блок двойной отправки.
 * Боту (заполнил ловушку) отвечаем «успехом», чтобы он не подбирал обход.
 */
export function useFormGuard() {
  const startedAt = useRef(Date.now());
  const busy = useRef(false);
  const [trap, setTrap] = useState("");

  /** Перезапуск таймера: когда форма появляется не сразу (последний шаг квиза). */
  const restart = useCallback(() => {
    startedAt.current = Date.now();
  }, []);

  const check = (): GuardResult => {
    if (busy.current) return { ok: false, bot: false, error: "Заявка уже отправляется" };
    if (trap) return { ok: false, bot: true };
    if (Date.now() - startedAt.current < MIN_FILL_MS) {
      return { ok: false, bot: false, error: "Слишком быстро. Проверьте данные и отправьте ещё раз." };
    }
    const limited = rateLimitError();
    return limited ? { ok: false, bot: false, error: limited } : { ok: true };
  };

  /** Обёртка отправки: держит блокировку и записывает заявку в лимит. */
  const run = async (send: () => Promise<void>) => {
    busy.current = true;
    try {
      await send();
      rememberSent();
    } finally {
      busy.current = false;
    }
  };

  return { trap, setTrap, check, run, restart };
}
