"use client";

import { legal, site } from "@/config/site";
import { channels, type Channel } from "@/lib/leads";
import s from "./forms.module.css";

export const SUCCESS_MESSAGE = `Спасибо! Мы свяжемся с вами в течение ${site.responseMinutes} минут в рабочее время.`;

export function FieldError({ id, error }: { id: string; error?: string | null }) {
  if (!error) return null;
  return (
    <p id={id} className={s.error} role="alert">
      {error}
    </p>
  );
}

/** Выбор канала связи: Telegram / WhatsApp / Звонок / E-mail. */
export function ChannelPicker({
  name,
  value,
  onChange,
  error,
  legend = "Как с вами связаться",
}: {
  name: string;
  value?: Channel;
  onChange: (c: Channel) => void;
  error?: string | null;
  legend?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <fieldset className={s.fieldset} aria-describedby={error ? errorId : undefined}>
      <legend className={s.label}>{legend}</legend>
      <div className={s.chips}>
        {channels.map((c) => (
          <label key={c.value} className={s.chip}>
            <input type="radio" name={name} value={c.value} checked={value === c.value} onChange={() => onChange(c.value)} required />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} error={error} />
    </fieldset>
  );
}

/** Обязательное согласие на обработку персональных данных (152-ФЗ). */
export function Consent({ id, checked, onChange, error }: { id: string; checked: boolean; onChange: (v: boolean) => void; error?: string | null }) {
  const errorId = `${id}-error`;
  return (
    <div className={s.consentWrap}>
      <label className={s.consent} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <span>
          Я согласен на обработку персональных данных в соответствии с{" "}
          <a href={legal.privacyUrl} target="_blank" rel="noopener">
            политикой конфиденциальности
          </a>
        </span>
      </label>
      <FieldError id={errorId} error={error} />
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  multiline,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  multiline?: boolean;
  optional?: boolean;
}) {
  const errorId = `${id}-error`;
  const common = {
    id,
    value,
    placeholder,
    className: s.input,
    "aria-invalid": !!error || undefined,
    "aria-describedby": error ? errorId : undefined,
    required: !optional,
  };
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        {label}
        {optional && <span className={s.optional}> (необязательно)</span>}
      </label>
      {multiline ? (
        <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      )}
      <FieldError id={errorId} error={error} />
    </div>
  );
}
