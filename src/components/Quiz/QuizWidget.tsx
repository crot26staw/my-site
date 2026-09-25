"use client";

import { useEffect, useRef, useState } from "react";
import { quizQuestions, quizRange, UNKNOWN_TYPE, type QuizAnswers } from "@/config/quiz";
import { formatPrice, site, type PlanId } from "@/config/site";
import { submitLead, validateContact, channels, type Channel } from "@/lib/leads";
import { ChannelPicker, Consent, SUCCESS_MESSAGE, TextField } from "../forms/Fields";
import f from "../forms/forms.module.css";
import s from "./Quiz.module.css";

const TOTAL = quizQuestions.length;
const RESULT = TOTAL;

interface QuizWidgetProps {
  /** Префикс id и имён полей: на главной два квиза (в блоке и в модалке), поля не должны пересекаться. */
  idPrefix?: string;
  /** Тариф, выбранный в первом вопросе заранее (кнопки тарифов, data-plan). */
  initialPlan?: PlanId;
  /** Внутри модалки: без своей рамки и фона, их даёт панель. */
  embedded?: boolean;
}

export function QuizWidget({ idPrefix = "quiz", initialPlan, embedded }: QuizWidgetProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(initialPlan ? { type: [initialPlan] } : {});
  const [channel, setChannel] = useState<Channel>();
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // При смене шага переводим фокус на заголовок шага (для клавиатуры и скринридеров)
  useEffect(() => {
    if (moved.current) headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const go = (next: number) => {
    moved.current = true;
    setStep(next);
  };

  const question = quizQuestions[step];
  const selected = question ? answers[question.id] ?? [] : [];
  const unknownType = answers.type?.[0] === UNKNOWN_TYPE;

  const toggle = (value: string) => {
    if (!question) return;
    let next: string[];
    if (!question.multiple) next = [value];
    else {
      const option = question.options.find((o) => o.value === value)!;
      if (selected.includes(value)) next = selected.filter((v) => v !== value);
      else if (option.exclusive) next = [value];
      else next = [...selected.filter((v) => !question.options.find((o) => o.value === v)?.exclusive), value];
    }
    setAnswers((a) => ({ ...a, [question.id]: next }));
  };

  const onNext = () => {
    if (step === 0 && unknownType) return go(RESULT);
    go(step + 1);
  };
  const onBack = () => go(step === RESULT && unknownType ? 0 : step - 1);

  const range = quizRange(answers);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = {
      channel: channel ? null : "Выберите, куда прислать расчёт",
      contact: validateContact(channel, contact),
      consent: consent ? null : "Нужно ваше согласие",
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setStatus("sending");
    await submitLead({
      source: "quiz",
      contact,
      channel,
      answers: Object.fromEntries(
        quizQuestions.map((q) => [q.title, (answers[q.id] ?? []).map((v) => q.options.find((o) => o.value === v)?.label)]),
      ),
      range,
    });
    setStatus("sent");
  };

  const progress = step === RESULT ? 100 : (step / TOTAL) * 100;
  const placeholder = channels.find((c) => c.value === channel)?.placeholder ?? "Ник, номер или e-mail";

  return (
    <div className={embedded ? `${s.widget} ${s.embedded}` : s.widget}>
      <div className={s.progress} aria-hidden={step === RESULT}>
        <span className={s.counter}>{step === RESULT ? "Готово" : `Вопрос ${step + 1} из ${TOTAL}`}</span>
        <div className={s.bar}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {question ? (
        <div className={s.step} key={question.id}>
          <fieldset className={s.fieldset} aria-labelledby={`${idPrefix}-q-${question.id}`}>
            <h3 id={`${idPrefix}-q-${question.id}`} ref={headingRef} tabIndex={-1} className={s.question}>
              {question.title}
            </h3>
            {question.multiple && <p className={s.hint}>Можно выбрать несколько</p>}
            <div className={s.options}>
              {question.options.map((o) => (
                <label key={o.value} className={s.option}>
                  <input
                    type={question.multiple ? "checkbox" : "radio"}
                    name={`${idPrefix}-${question.id}`}
                    value={o.value}
                    checked={selected.includes(o.value)}
                    onChange={() => toggle(o.value)}
                  />
                  <span className={s.box} aria-hidden="true" />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={s.nav}>
            {step > 0 && (
              <button type="button" className="btn btn--outline" onClick={onBack}>
                Назад
              </button>
            )}
            <button type="button" className="btn btn--primary" onClick={onNext} disabled={selected.length === 0}>
              Далее
            </button>
          </div>
        </div>
      ) : (
        <div className={s.step}>
          <h3 ref={headingRef} tabIndex={-1} className={s.question}>
            {range ? (
              <>
                Примерная стоимость:{" "}
                <span className={s.price}>
                  от {formatPrice(range.min).replace(/ ₽$/, "")} до {range.max ? formatPrice(range.max) : "[Y] ₽"}
                </span>
              </>
            ) : (
              "Подберём решение на бесплатной консультации"
            )}
          </h3>

          {status === "sent" ? (
            <p className={f.success} role="status">
              {SUCCESS_MESSAGE}
            </p>
          ) : (
            <form className={s.form} onSubmit={onSubmit} noValidate>
              <p className={s.lead}>
                Точную цену рассчитаем в течение {site.responseMinutes} минут и зафиксируем в договоре. Куда прислать
                расчёт?
              </p>
              <ChannelPicker name={`${idPrefix}-channel`} value={channel} onChange={setChannel} error={errors.channel} legend="Куда прислать расчёт" />
              <TextField
                id={`${idPrefix}-contact`}
                label="Контакт"
                value={contact}
                onChange={setContact}
                placeholder={placeholder}
                type={channel === "email" ? "email" : "text"}
                inputMode={channel === "email" ? "email" : channel === "telegram" || !channel ? "text" : "tel"}
                autoComplete={channel === "email" ? "email" : "tel"}
                error={errors.contact}
              />
              <Consent id={`${idPrefix}-consent`} checked={consent} onChange={setConsent} error={errors.consent} />
              <div className={s.nav}>
                <button type="button" className="btn btn--outline" onClick={onBack}>
                  Назад
                </button>
                <button type="submit" className="btn btn--primary" disabled={status === "sending"}>
                  {status === "sending" ? "Отправляем…" : "Получить точный расчёт"}
                </button>
              </div>
              <p className={f.fine}>Расчёт ни к чему не обязывает.</p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
