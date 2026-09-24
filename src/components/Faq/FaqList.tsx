"use client";

import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/scroll";
import s from "./Faq.module.css";

const DURATION = 380;
const EASING = "cubic-bezier(0.33, 1, 0.68, 1)";

/**
 * Аккордеон на <details>: без JS работает как обычно, с JS — плавно раскрывается
 * и держит открытым только один вопрос. Высота меняется плавно, поэтому и прогресс
 * скролла комнаты (а с ним камера) меняется без скачка.
 */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  const animate = (item: HTMLDetailsElement, open: boolean) => {
    const body = item.querySelector<HTMLElement>(`.${s.body}`)!;
    body.getAnimations().forEach((a) => a.cancel());
    if (prefersReducedMotion()) {
      item.open = open;
      return;
    }
    const from = open ? 0 : body.offsetHeight;
    if (open) item.open = true;
    const to = open ? body.scrollHeight : 0;
    const animation = body.animate(
      [
        { height: `${from}px`, opacity: open ? 0 : 1 },
        { height: `${to}px`, opacity: open ? 1 : 0 },
      ],
      { duration: DURATION, easing: EASING },
    );
    item.dataset.closing = open ? "" : "true";
    animation.onfinish = () => {
      if (!open) item.open = false;
      delete item.dataset.closing;
    };
  };

  const onToggleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const item = event.currentTarget.parentElement as HTMLDetailsElement;
    const opening = !item.open || item.dataset.closing === "true";
    if (opening) {
      listRef.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((other) => {
        if (other !== item && other.dataset.closing !== "true") animate(other, false);
      });
    }
    animate(item, opening);
  };

  return (
    <div ref={listRef} className={s.list}>
      {items.map(({ q, a }) => (
        <details key={q} className={s.item} data-reveal>
          <summary className={s.question} onClick={onToggleClick}>
            <span>{q}</span>
            <span className={s.toggle} aria-hidden="true" />
          </summary>
          <div className={s.body}>
            <p className={s.answer}>{a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
