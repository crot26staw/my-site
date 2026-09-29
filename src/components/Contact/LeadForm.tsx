"use client";

import { useState } from "react";
import { LIMITS, sanitize, useFormGuard } from "@/lib/antispam";
import { submitLead, validateContact, validateName, validateTask, validateUrl, type Channel } from "@/lib/leads";
import { ChannelPicker, Consent, FormError, Honeypot, SUCCESS_MESSAGE, TextField } from "../forms/Fields";
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
  const id = `${idPrefix}-${variant}`;
  const source = `form-${variant}` as const;
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
    try {
      await guard.run(() =>
        submitLead({
          source,
          place: idPrefix === "form" ? "contact" : idPrefix,
          name: sanitize(values.name, LIMITS.name),
          contact: sanitize(values.contact, LIMITS.contact),
          channel,
          ...(variant === "audit"
            ? { url: sanitize(values.url, LIMITS.url) }
            : { task: sanitize(values.task, LIMITS.task, true) }),
        }),
      );
      setStatus("sent");
    } catch {
      setStatus("idle");
      setFormError("Не получилось отправить заявку. Попробуйте ещё раз.");
    }
  };

  if (status === "sent") {
    return (
      <p className={f.success} role="status">
        {SUCCESS_MESSAGE}
      </p>
    );
  }

  return (
    <form id={id} className={s.form} onSubmit={onSubmit} noValidate tabIndex={-1} style={{ position: "relative" }}>
      <Honeypot id={`${id}-website`} value={guard.trap} onChange={guard.setTrap} />
      {variant === "audit" && (
        <TextField
          id={`${id}-url`}
          label="Ссылка на сайт"
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
      <TextField id={`${id}-name`} label="Имя" value={values.name} onChange={set("name")} autoComplete="name" maxLength={LIMITS.name} error={errors.name} />
      <TextField
        id={`${id}-contact`}
        label="Телефон или ник в Telegram"
        value={values.contact}
        onChange={set("contact")}
        placeholder="+7 или @ник"
        autoComplete="tel"
        maxLength={LIMITS.contact}
        error={errors.contact}
      />
      <ChannelPicker name={`${id}-channel`} value={channel} onChange={setChannel} error={errors.channel} />
      {variant === "new" && (
        <TextField
          id={`${id}-task`}
          label="Коротко о задаче"
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
