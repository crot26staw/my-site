"use client";

import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { popClose, popOpen, sourceRect } from "@/lib/popFrom";
import { lockScroll, prefersReducedMotion } from "@/lib/scroll";
import s from "./Modal.module.css";

interface ModalProps {
  /** Имя data-атрибута кнопок, которые открывают модалку: "lead" → клик по [data-lead]. */
  trigger: string;
  /**
   * Нажата кнопка-триггер. Вызывается синхронно (flushSync) до открытия — содержимое,
   * которое здесь выставляется, уже в DOM к замеру для анимации. open — модалка уже открыта.
   */
  onTrigger: (link: HTMLElement, open: boolean) => void;
  labelledBy: string;
  /** Панель шире (квиз). */
  wide?: boolean;
  panelStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Модальное окно на <dialog>: открывается по клику на кнопку с data-<trigger>
 * (href у такой кнопки — запасной путь без JS). Панель появляется из нажатой кнопки маленькой,
 * вырастает и встаёт по центру; при закрытии — обратно (src/lib/popFrom.ts).
 */
export function Modal({ trigger, onTrigger, labelledBy, wide, panelStyle, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLElement | null>(null);
  // Свежий onTrigger без переподписки на клики
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    const dialog = ref.current!;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLElement>(`[data-${trigger}]`);
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      // Capture — раньше ScrollDirector и Link: они видят defaultPrevented и не прокручивают / не переходят.
      event.preventDefault();
      if (dialog.open) return onTriggerRef.current(link, true);
      flushSync(() => onTriggerRef.current(link, false));
      delete dialog.dataset.closing;
      sourceRef.current = link;
      dialog.showModal();
      lockScroll(true);
      const from = sourceRect(link);
      if (from && !prefersReducedMotion()) animate(dialog, popOpen(panelRef.current!, from));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [trigger]);

  const close = () => {
    const dialog = ref.current!;
    if (!dialog.open || dialog.dataset.closing) return;
    const finish = () => {
      delete dialog.dataset.closing;
      dialog.close();
    };
    if (prefersReducedMotion()) return finish();
    dialog.dataset.closing = "true";
    const panel = panelRef.current!;
    const to = sourceRect(sourceRef.current);
    const animation = to
      ? popClose(panel, to)
      : panel.animate({ opacity: 0, transform: "translateY(10px) scale(0.98)" }, { duration: 220, easing: "ease", fill: "forwards" });
    animate(dialog, animation).finished.then(() => {
      finish();
      animation.cancel();
    });
  };

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={labelledBy}
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClose={() => lockScroll(false)}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div ref={panelRef} className={wide ? `${s.panel} ${s.wide}` : s.panel} style={panelStyle}>
        <button type="button" className={s.close} onClick={close} aria-label="Закрыть">
          <span aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  );
}

/** Пока панель летит, диалог не прокручивается (иначе сдвинутая панель даёт полосу прокрутки). */
function animate(dialog: HTMLDialogElement, animation: Animation): Animation {
  dialog.dataset.animating = "true";
  const done = () => delete dialog.dataset.animating;
  animation.finished.then(done, done);
  return animation;
}
