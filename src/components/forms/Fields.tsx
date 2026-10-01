"use client";

import { asset } from "@/lib/asset";
import { channels, type Channel } from "@/lib/leads";
import { privacyPath } from "@/lib/paths";
import { useSiteContent } from "../ContentProvider";
import s from "./forms.module.css";

export function FieldError({ id, error }: { id: string; error?: string | null }) {
  if (!error) return null;
  return (
    <p id={id} className={s.error} role="alert">
      {error}
    </p>
  );
}

/** Ошибка всей формы (лимит частоты, слишком быстрая отправка). */
export function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p className={s.error} role="alert">
      {error}
    </p>
  );
}

/**
 * Поле-ловушка для ботов: человек его не видит и не может попасть в него с клавиатуры,
 * а бот, заполняющий все поля подряд, заполнит и его.
 */
export function Honeypot({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={s.trap} aria-hidden="true">
      <label htmlFor={id}>Оставьте это поле пустым</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Выбор канала связи: Telegram / WhatsApp / Звонок / E-mail. */
export function ChannelPicker({
  name,
  value,
  onChange,
  error,
  legend,
}: {
  name: string;
  value?: Channel;
  onChange: (c: Channel) => void;
  error?: string | null;
  legend?: string;
}) {
  const { forms } = useSiteContent();
  const errorId = `${name}-error`;
  return (
    <fieldset className={s.fieldset} aria-describedby={error ? errorId : undefined}>
      <legend className={s.label}>{legend ?? forms.fields.channel}</legend>
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
  const { forms } = useSiteContent();
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
          {forms.consentText}{" "}
          <a href={asset(privacyPath)} target="_blank" rel="noopener">
            {forms.consentLink}
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
  maxLength,
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
  maxLength?: number;
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
    maxLength,
    spellCheck: multiline ? undefined : false,
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
