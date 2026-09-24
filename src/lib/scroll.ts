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
  return clamp01(-rect.top / Math.max(1, rect.height - viewportHeight));
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
