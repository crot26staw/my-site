import { useSyncExternalStore } from "react";
import { VIEW_MODE_KEY } from "./viewModeScript";

/**
 * Режим просмотра: «3d» — прогулка по комнатам, «flat» — обычная страница без сцены.
 *
 * Источник правды — атрибут data-mode на <html>: data-mode="3d" включает 3D, без него — обычный режим.
 * По умолчанию сайт обычный; выбор 3D хранится в localStorage и до отрисовки восстанавливается
 * скриптом VIEW_MODE_SCRIPT (viewModeScript.ts).
 */
export type ViewMode = "3d" | "flat";

const listeners = new Set<() => void>();

export function getViewMode(): ViewMode {
  return document.documentElement.dataset.mode === "3d" ? "3d" : "flat";
}

export function onViewMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * persist: false — переключение без запоминания (например, откат в обычный режим, когда нет WebGL).
 * Высота страницы в режимах сильно разная, поэтому после переключения возвращаемся к той же секции.
 */
export function setViewMode(mode: ViewMode, { persist = true } = {}): void {
  if (persist) {
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // приватный режим или запрещённое хранилище — просто не запоминаем
    }
  }
  if (mode === getViewMode()) return;

  const anchor = currentSection();
  if (mode === "3d") document.documentElement.dataset.mode = "3d";
  else delete document.documentElement.dataset.mode;
  if (!anchor || anchor.id === "hero") window.scrollTo(0, 0);
  else anchor.scrollIntoView({ block: "start" });
  listeners.forEach((listener) => listener());
}

export function useViewMode(): ViewMode {
  return useSyncExternalStore(onViewMode, getViewMode, () => "flat");
}

/** Последняя секция, верх которой уже поднялся выше середины экрана. В переходе между комнатами — та, из которой вышли. */
function currentSection(): HTMLElement | undefined {
  const middle = window.innerHeight / 2;
  let found: HTMLElement | undefined;
  for (const section of document.querySelectorAll<HTMLElement>("main > section[id]")) {
    if (section.getBoundingClientRect().top <= middle) found = section;
    else break;
  }
  return found;
}
