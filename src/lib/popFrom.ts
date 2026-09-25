/**
 * Появление панели из кнопки: у кнопки возникает маленькая копия окна,
 * затем она вырастает до полного размера и встаёт по центру. Закрытие — то же в обратную сторону.
 */

const OPEN_MS = 560;
const CLOSE_MS = 420;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function keyframes(panel: HTMLElement, source: DOMRect): Keyframe[] {
  const p = panel.getBoundingClientRect();
  // Маленькое окно — примерно в ширину кнопки, по центру кнопки, но целиком на экране
  // (кнопка в шапке или у края — окно сдвигается внутрь).
  const small = clamp(source.width / p.width, 0.18, 0.35);
  const halfW = (p.width * small) / 2 + 8;
  const halfH = (p.height * small) / 2 + 8;
  const cx = clamp(source.left + source.width / 2, halfW, Math.max(halfW, window.innerWidth - halfW));
  const cy = clamp(source.top + source.height / 2, halfH, Math.max(halfH, window.innerHeight - halfH));
  const dx = cx - (p.left + p.width / 2);
  const dy = cy - (p.top + p.height / 2);

  panel.style.transformOrigin = "50% 50%";
  return growKeyframes(dx, dy, small);
}

/**
 * Два этапа: точка раскрывается в маленькое окно (сдвинутое на dx, dy и уменьшенное до small),
 * затем окно растёт до полного размера на своём месте. Общие для модалки и перехода между страницами.
 */
export function growKeyframes(dx: number, dy: number, small: number): Keyframe[] {
  // Кривые подобраны так, чтобы на стыке этапов скорость не падала до нуля:
  // без остановки нет рывка, когда маленькое окно начинает расти.
  return [
    { offset: 0, opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.04)`, easing: "cubic-bezier(0.3, 0.7, 0.7, 0.9)" },
    { offset: 0.22, opacity: 1, transform: `translate(${dx}px, ${dy}px) scale(${small})`, easing: "cubic-bezier(0.4, 0.2, 0.2, 1)" },
    { offset: 1, opacity: 1, transform: "none" },
  ];
}

export function popOpen(panel: HTMLElement, source: DOMRect): Animation {
  return panel.animate(keyframes(panel, source), { duration: OPEN_MS, fill: "backwards" });
}

export function popClose(panel: HTMLElement, source: DOMRect): Animation {
  return panel.animate(keyframes(panel, source), { duration: CLOSE_MS, direction: "reverse", fill: "forwards" });
}

/** Кнопка, из которой можно появиться: на месте и видна на экране. */
export function sourceRect(el: Element | null): DOMRect | null {
  if (!el?.isConnected) return null;
  const r = el.getBoundingClientRect();
  const visible = r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  return visible ? r : null;
}
