"use client";

import { useState } from "react";
import { audit, site } from "@/config/site";
import { LeadForm, type Variant } from "../Contact/LeadForm";
import { Modal } from "../Modal/Modal";
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

/** Модалка заявки. Открывается по клику на любую ссылку с data-lead="new" | "audit" (href="#contact" — запасной путь без JS). */
export function LeadModal() {
  const [variant, setVariant] = useState<LeadVariant>("new");
  // Новый key при каждом открытии — форма начинается с чистого листа.
  const [session, setSession] = useState(0);

  const tab = TABS.find((t) => t.variant === variant)!;

  return (
    <Modal
      trigger="lead"
      labelledBy="lead-modal-title"
      onTrigger={(link, open) => {
        setVariant(link.dataset.lead === "audit" ? "audit" : "new");
        if (!open) setSession((n) => n + 1);
      }}
    >
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

      <p className={s.fine}>Ответим в течение {site.responseMinutes} минут в рабочее время. Ни к чему не обязывает.</p>
    </Modal>
  );
}
