"use client";

import { useState } from "react";
import { useSiteContent } from "../ContentProvider";
import { LeadForm, type Variant } from "../Contact/LeadForm";
import { Modal } from "../Modal/Modal";
import s from "./LeadModal.module.css";

export type LeadVariant = Variant;

/** Модалка заявки. Открывается по клику на любую ссылку с data-lead="new" | "audit" (href="#contact" — запасной путь без JS). */
export function LeadModal() {
  const { forms } = useSiteContent();
  const m = forms.modal;
  const tabs: { variant: LeadVariant; label: string; title: string; text: string; submit: string }[] = [
    { variant: "new", label: m.newTab, title: m.newTitle, text: m.newText, submit: m.newSubmit },
    { variant: "audit", label: m.auditTab, title: m.auditTitle, text: m.auditText, submit: m.auditSubmit },
  ];
  const [variant, setVariant] = useState<LeadVariant>("new");
  // Новый key при каждом открытии — форма начинается с чистого листа.
  const [session, setSession] = useState(0);

  const tab = tabs.find((t) => t.variant === variant)!;

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
        {tabs.map((t) => (
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

      <p className={s.fine}>{m.fine}</p>
    </Modal>
  );
}
