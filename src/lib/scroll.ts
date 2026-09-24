/**
 * Общее состояние скролла для HTML и 3D-сцены.
 *
 * Участки страницы с атрибутом data-track="<id>" получают прогресс 0..1:
 * - data-track-mode="pin"   — 0, когда верх участка у верха экрана; 1, когда низ у низа экрана;
 * - data-track-mode="enter" — 0, когда верх участка у низа экрана;  1, когда низ у низа экрана.
 * Прогресс пишется в CSS-переменную --p на элементе и в trackProgress для сцены.
 */

export const trackProgress: Record<string, number> = {};

type FrameCallback = (time: number) => void;
const subscribers = new Set<FrameCallback>();

export function onFrame(callback: FrameCallback): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function emitFrame(time: number): void {
  subscribers.forEach((cb) => cb(time));
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function measureTrack(el: HTMLElement, viewportHeight: number): number {
  const rect = el.getBoundingClientRect();
  if (el.dataset.trackMode === "enter") {
    return clamp01((viewportHeight - rect.top) / Math.max(1, rect.height));
  }
  // Конец — низ участка у низа экрана (дальше начинается переход). Начало — верх у верха экрана,
  // но у блока ниже экрана этот отрезок короткий или отрицательный, и камера прыгала бы на весь
  // READ_DRIFT за пару пикселей. Поэтому даём ему не меньше PIN_MIN_RANGE экрана: старт раньше,
  // пока верх ещё внизу — но не раньше PIN_MAX_START (там заканчивается предыдущий переход, см. .passage).
  const end = viewportHeight - rect.height;
  const start = Math.min(PIN_MAX_START * viewportHeight, Math.max(0, end + PIN_MIN_RANGE * viewportHeight));
  return clamp01((start - rect.top) / Math.max(1, start - end));
}

const PIN_MIN_RANGE = 0.5;
const PIN_MAX_START = 0.6;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Блокировка прокрутки страницы (модальные окна). Плавный скролл регистрирует свой обработчик. */
let scrollLockHandler: ((locked: boolean) => void) | null = null;

export function onScrollLock(handler: (locked: boolean) => void): () => void {
  scrollLockHandler = handler;
  return () => {
    if (scrollLockHandler === handler) scrollLockHandler = null;
  };
}

export function lockScroll(locked: boolean): void {
  document.documentElement.classList.toggle("scroll-locked", locked);
  scrollLockHandler?.(locked);
}
