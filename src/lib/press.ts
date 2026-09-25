/**
 * Продавливание карточек [data-press] под курсором мыши: карточка наклоняется так,
 * что точка под курсором уходит вглубь, и чуть уменьшается.
 *
 * Наклон — через CSS-свойства rotate/scale (стили в globals.css): они складываются с transform,
 * поэтому не ломают появление [data-reveal] и приподнятую популярную карточку тарифов.
 */

const MAX_ANGLE = 7; // градусов у края карточки

export function initPress(): () => void {
  let active: HTMLElement | null = null;

  const release = () => {
    if (!active) return;
    active.style.removeProperty("--press-x");
    active.style.removeProperty("--press-y");
    active.style.removeProperty("--press-angle");
    active.removeAttribute("data-pressed");
    active = null;
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const card = (event.target as Element | null)?.closest<HTMLElement>("[data-press]") ?? null;
    if (card !== active) release();
    if (!card) return;
    active = card;

    const r = card.getBoundingClientRect();
    // Положение курсора относительно центра: -1..1 по каждой оси.
    const nx = Math.max(-1, Math.min(1, ((event.clientX - r.left) / r.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((event.clientY - r.top) / r.height) * 2 - 1));
    const strength = Math.min(1, Math.hypot(nx, ny));
    // Ось вращения перпендикулярна направлению на курсор — точка под курсором уходит от зрителя.
    card.style.setProperty("--press-x", (-ny).toFixed(3));
    card.style.setProperty("--press-y", nx.toFixed(3));
    card.style.setProperty("--press-angle", `${(strength * MAX_ANGLE).toFixed(2)}deg`);
    card.setAttribute("data-pressed", "");
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", release);
  return () => {
    release();
    document.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", release);
  };
}
