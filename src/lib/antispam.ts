/**
 * Фронтенд-защита форм от ботов и мусора. Это только первый рубеж:
 * сервер повторяет те же проверки и добавляет лимит по IP (src/actions/leads.ts).
 */

import { useCallback, useRef, useState } from "react";

export { LIMITS, checkText, sanitize } from "./textGuard";

/** Быстрее этого человек форму не заполнит. */
const MIN_FILL_MS = 2500;
/** Пауза между заявками с одного браузера. */
const MIN_INTERVAL_MS = 30_000;
/** Не больше MAX_PER_WINDOW заявок за WINDOW_MS. */
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 60 * 60_000;
const STORAGE_KEY = "leads:sent";

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

  /** Сколько заполняли форму — сервер тоже отсекает слишком быстрые отправки. */
  const elapsed = () => Date.now() - startedAt.current;

  return { trap, setTrap, check, run, restart, elapsed };
}
