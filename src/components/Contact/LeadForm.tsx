"use client";

import { useState } from "react";
import { submitLead, validateContact, validateUrl, type Channel } from "@/lib/leads";
import { ChannelPicker, Consent, SUCCESS_MESSAGE, TextField } from "../forms/Fields";
import f from "../forms/forms.module.css";
import s from "./Contact.module.css";

type Variant = "new" | "audit";

export function LeadForm({ variant, submitLabel }: { variant: Variant; submitLabel: string }) {
  const id = `form-${variant}`;
  const [values, setValues] = useState({ url: "", name: "", contact: "", task: "" });
  const [channel, setChannel] = useState<Channel>();
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (key: keyof typeof values) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Record<string, string | null> = {
      url: variant === "audit" ? validateUrl(values.url) : null,
      name: values.name.trim() ? null : "Как к вам обращаться?",
      contact: validateContact(undefined, values.contact),
      channel: channel ? null : "Выберите удобный способ связи",
      consent: consent ? null : "Нужно ваше согласие",
    };
    setErrors(next);
    const firstError = Object.keys(next).find((k) => next[k]);
    if (firstError) {
      const selector = firstError === "channel" ? `[name="${id}-channel"]` : `#${id}-${firstError}`;
      e.currentTarget.querySelector<HTMLElement>(selector)?.focus();
      return;
    }
    setStatus("sending");
    await submitLead({
      source: id as "form-new" | "form-audit",
      name: values.name,
      contact: values.contact,
      channel,
      ...(variant === "audit" ? { url: values.url } : { task: values.task }),
    });
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <p className={f.success} role="status">
        {SUCCESS_MESSAGE}
      </p>
    );
  }

  return (
    <form id={id} className={s.form} onSubmit={onSubmit} noValidate tabIndex={-1}>
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
          error={errors.url}
        />
      )}
      <TextField id={`${id}-name`} label="Имя" value={values.name} onChange={set("name")} autoComplete="name" error={errors.name} />
      <TextField
        id={`${id}-contact`}
        label="Телефон или ник в Telegram"
        value={values.contact}
        onChange={set("contact")}
        placeholder="+7 или @ник"
        autoComplete="tel"
        error={errors.contact}
      />
      <ChannelPicker name={`${id}-channel`} value={channel} onChange={setChannel} error={errors.channel} />
      {variant === "new" && (
        <TextField id={`${id}-task`} label="Коротко о задаче" value={values.task} onChange={set("task")} multiline optional />
      )}
      <Consent id={`${id}-consent`} checked={consent} onChange={setConsent} error={errors.consent} />
      <button type="submit" className={`btn btn--primary ${s.submit}`} disabled={status === "sending"}>
        {status === "sending" ? "Отправляем…" : submitLabel}
      </button>
    </form>
  );
}
