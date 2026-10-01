"use client";

import { useState } from "react";
import { LIMITS, sanitize, useFormGuard } from "@/lib/antispam";
import { submitLead } from "@/actions/leads";
import { validateContact, validateName, validateTask, validateUrl, type Channel } from "@/lib/leads";
import { useSiteContent } from "../ContentProvider";
import { ChannelPicker, Consent, FormError, Honeypot, TextField } from "../forms/Fields";
import f from "../forms/forms.module.css";
import s from "./Contact.module.css";

export type Variant = "new" | "audit";

interface LeadFormProps {
  variant: Variant;
  submitLabel: string;
  /** Префикс id полей: одна и та же форма есть и в блоке «Контакты», и в модалке. */
  idPrefix?: string;
}

export function LeadForm({ variant, submitLabel, idPrefix = "form" }: LeadFormProps) {
  const { forms } = useSiteContent();
  const id = `${idPrefix}-${variant}`;
  const [values, setValues] = useState({ url: "", name: "", contact: "", task: "" });
  const [channel, setChannel] = useState<Channel>();
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const guard = useFormGuard();

  const set = (key: keyof typeof values) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, string | null> = {
      url: variant === "audit" ? validateUrl(values.url) : null,
      name: validateName(values.name),
      contact: validateContact(undefined, values.contact),
      channel: channel ? null : "Выберите удобный способ связи",
      task: variant === "new" ? validateTask(values.task) : null,
      consent: consent ? null : "Нужно ваше согласие",
    };
    setErrors(next);
    setFormError(null);
    const firstError = Object.keys(next).find((k) => next[k]);
    if (firstError) {
      const selector = firstError === "channel" ? `[name="${id}-channel"]` : `#${id}-${firstError}`;
      e.currentTarget.querySelector<HTMLElement>(selector)?.focus();
      return;
    }
    const verdict = guard.check();
    if (!verdict.ok) {
      if (verdict.bot) setStatus("sent");
      else setFormError(verdict.error);
      return;
    }
    setStatus("sending");
    const common = {
      place: idPrefix === "form" ? "contact" : idPrefix,
      name: sanitize(values.name, LIMITS.name),
      contact: sanitize(values.contact, LIMITS.contact),
      channel,
      website: guard.trap,
      elapsedMs: guard.elapsed(),
    };
    // Ошибка от сервера (лимит, проверка полей) — её текст; сбой сети — общее сообщение
    let serverError = null as string | null;
    try {
      await guard.run(async () => {
        const result = await submitLead(
          variant === "audit"
            ? { ...common, source: "form-audit", url: sanitize(values.url, LIMITS.url) }
            : { ...common, source: "form-new", task: sanitize(values.task, LIMITS.task, true) },
        );
        if (!result.ok) {
          serverError = result.error;
          throw new Error(result.error);
        }
      });
      setStatus("sent");
    } catch {
      setStatus("idle");
      setFormError(serverError ?? forms.sendError);
    }
  };

  if (status === "sent") {
    return (
      <p className={f.success} role="status">
        {forms.success}
      </p>
    );
  }

  return (
    <form id={id} className={s.form} onSubmit={onSubmit} noValidate tabIndex={-1} style={{ position: "relative" }}>
      <Honeypot id={`${id}-website`} value={guard.trap} onChange={guard.setTrap} />
      {variant === "audit" && (
        <TextField
          id={`${id}-url`}
          label={forms.fields.url}
          value={values.url}
          onChange={set("url")}
          placeholder="https://"
          type="url"
          inputMode="url"
          autoComplete="url"
          maxLength={LIMITS.url}
          error={errors.url}
        />
      )}
      <TextField id={`${id}-name`} label={forms.fields.name} value={values.name} onChange={set("name")} autoComplete="name" maxLength={LIMITS.name} error={errors.name} />
      <TextField
        id={`${id}-contact`}
        label={forms.fields.contact}
        value={values.contact}
        onChange={set("contact")}
        placeholder={forms.fields.contactPlaceholder}
        autoComplete="tel"
        maxLength={LIMITS.contact}
        error={errors.contact}
      />
      <ChannelPicker name={`${id}-channel`} value={channel} onChange={setChannel} error={errors.channel} />
      {variant === "new" && (
        <TextField
          id={`${id}-task`}
          label={forms.fields.task}
          value={values.task}
          onChange={set("task")}
          multiline
          optional
          maxLength={LIMITS.task}
          error={errors.task}
        />
      )}
      <Consent id={`${id}-consent`} checked={consent} onChange={setConsent} error={errors.consent} />
      <FormError error={formError} />
      <button type="submit" className={`btn btn--primary ${s.submit}`} disabled={status === "sending"}>
        {status === "sending" ? "Отправляем…" : submitLabel}
      </button>
    </form>
  );
}
