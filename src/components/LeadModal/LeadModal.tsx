"use client";

import { useEffect, useRef, useState } from "react";
import { audit, site } from "@/config/site";
import { lockScroll, prefersReducedMotion } from "@/lib/scroll";
import { LeadForm, type Variant } from "../Contact/LeadForm";
import s from "./LeadModal.module.css";

export type LeadVariant = Variant;

const TABS: { variant: LeadVariant; label: string; title: string; text: string; submit: string }[] = [
  {
    variant: "new",
    label: "Новый сайт",
    title: "Обсудим ваш проект",
    text: "Расскажите о задаче, и мы предложим решение с точным расчётом стоимости и сроков.",
    submit: "Получить расчёт",
  },
  {
    variant: "audit",
    label: "Аудит сайта",
    title: "Бесплатный аудит сайта",
    text: `Пришлите ссылку, и за ${audit.hours} часа мы найдём ${audit.problems} проблем, которые мешают сайту продавать.`,
    submit: "Получить бесплатный аудит",
  },
];

/**
 * Модалка заявки. Открывается по клику на любую ссылку с data-lead="new" | "audit"
 * (href="#contact" у таких ссылок — запасной путь без JS).
 */
export function LeadModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const [variant, setVariant] = useState<LeadVariant>("new");
  // Новый key при каждом открытии — форма начинается с чистого листа.
  const [session, setSession] = useState(0);

  useEffect(() => {
    const dialog = ref.current!;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLElement>("[data-lead]");
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      // Capture — раньше ScrollDirector: он видит defaultPrevented и не прокручивает к #contact.
      event.preventDefault();
      setVariant(link.dataset.lead === "audit" ? "audit" : "new");
      if (dialog.open) return;
      setSession((n) => n + 1);
      delete dialog.dataset.closing;
      dialog.showModal();
      lockScroll(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const close = () => {
    const dialog = ref.current!;
    if (!dialog.open || dialog.dataset.closing) return;
    const finish = () => {
      delete dialog.dataset.closing;
      dialog.close();
    };
    if (prefersReducedMotion()) return finish();
    dialog.dataset.closing = "true";
    // animationend всплывает и от панели — ждём анимацию самого диалога.
    const onEnd = (e: AnimationEvent) => {
      if (e.target !== dialog) return;
      dialog.removeEventListener("animationend", onEnd);
      finish();
    };
    dialog.addEventListener("animationend", onEnd);
  };

  const tab = TABS.find((t) => t.variant === variant)!;

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="lead-modal-title"
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClose={() => lockScroll(false)}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className={s.panel}>
        <button type="button" className={s.close} onClick={close} aria-label="Закрыть">
          <span aria-hidden="true" />
        </button>

        <div className={s.tabs} role="tablist" aria-label="С чего начать">
          {TABS.map((t) => (
            <button
              key={t.variant}
              type="button"
              role="tab"
              aria-selected={t.variant === variant}
              className={s.tab}
              onClick={() => setVariant(t.variant)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <h2 id="lead-modal-title" className={s.title}>
          {tab.title}
        </h2>
        <p className={s.text}>{tab.text}</p>

        <LeadForm key={`${session}-${variant}`} variant={variant} submitLabel={tab.submit} idPrefix="modal" />

        <p className={s.fine}>
          Ответим в течение {site.responseMinutes} минут в рабочее время. Ни к чему не обязывает.
        </p>
      </div>
    </dialog>
  );
}
