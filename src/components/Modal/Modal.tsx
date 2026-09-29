"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
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
  /** Панель шире: "wide" — квиз, "full" — во всю ширину блоков сайта (кейс). */
  size?: "wide" | "full";
  /** Открыта сразу при загрузке страницы (прямой заход на адрес кейса). */
  initialOpen?: boolean;
  /** Управление снаружи: открыть или закрыть без клика по кнопке (кнопки «назад/вперёд» браузера). */
  handle?: React.Ref<ModalHandle>;
  /** Закрыта пользователем — крестиком, Esc или кликом мимо панели (не через handle.close). */
  onDismiss?: () => void;
  panelStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Модальное окно на <dialog>: открывается по клику на кнопку с data-<trigger>
 * (href у такой кнопки — запасной путь без JS). Панель появляется из нажатой кнопки маленькой,
 * вырастает и встаёт по центру; при закрытии — обратно (src/lib/popFrom.ts).
 */
export interface ModalHandle {
  open: () => void;
  close: () => void;
}

export function Modal({ trigger, onTrigger, labelledBy, size, initialOpen, handle, onDismiss, panelStyle, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLElement | null>(null);
  // Свежий onTrigger без переподписки на клики
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;
  // Эта модалка держит блокировку прокрутки страницы (счётчик в lockScroll — снимаем ровно один раз)
  const locked = useRef(false);
  const lock = (on: boolean) => {
    if (locked.current === on) return;
    locked.current = on;
    lockScroll(on);
  };

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
      lock(true);
      const from = sourceRect(link);
      if (from && !prefersReducedMotion()) animate(dialog, popOpen(panelRef.current!, from));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [trigger]);

  // Страница, которая и есть открытая модалка (прямой заход на кейс): в HTML диалог уже открыт
  // (data-preopen — обычный open, стилизованный как модалка), здесь без видимой смены
  // переводим его в настоящий модальный режим. Проверка атрибута — эффект в StrictMode срабатывает дважды.
  // Уход на другую страницу с открытой модалкой (крошки в кейсе) — снимаем блокировку прокрутки.
  useEffect(() => {
    const dialog = ref.current!;
    if (dialog.hasAttribute("data-preopen")) {
      dialog.close();
      dialog.removeAttribute("data-preopen");
      dialog.showModal();
    }
    if (dialog.open) lock(true);
    return () => lock(false);
  }, []);

  useImperativeHandle(handle, () => ({
    open() {
      const dialog = ref.current!;
      if (dialog.open) return;
      sourceRef.current = null;
      dialog.showModal();
      lock(true);
    },
    close,
  }));

  function close() {
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
  }

  const dismiss = () => {
    if (!ref.current!.open || ref.current!.dataset.closing) return;
    close();
    onDismiss?.();
  };

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      open={initialOpen || undefined}
      data-preopen={initialOpen || undefined}
      aria-labelledby={labelledBy}
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClose={() => lock(false)}
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <div ref={panelRef} className={[s.panel, size && s[size], initialOpen && s.enter].filter(Boolean).join(" ")} style={panelStyle}>
        <button type="button" className={s.close} onClick={dismiss} aria-label="Закрыть">
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
