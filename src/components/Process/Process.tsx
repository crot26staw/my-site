import { getContent } from "@/lib/server/content";
import { Room } from "../Room/Room";
import s from "./Process.module.css";

export async function Process() {
  const t = (await getContent()).blocks.process;
  return (
    <Room id="process" room="process" index="06" title={t.title} lead={t.lead}>
      <ol className={s.timeline}>
        {t.steps.map((step, i) => (
          <li key={i} className={s.step} data-reveal>
            <span className={s.num} aria-hidden="true">
              {i + 1}
            </span>
            <h3 className={s.title}>
              <span className="visually-hidden">Этап {i + 1}. </span>
              {step.title}
            </h3>
            <p className={s.text}>{step.text}</p>
            <p className={s.term}>{step.term}</p>
          </li>
        ))}
      </ol>

      <p className={s.payment} data-reveal>
        <strong>{t.paymentTitle}</strong> {t.paymentText}
      </p>
      <p className={s.note}>{t.note}</p>

      <div data-reveal>
        <a href="#contact" data-lead="new" className="btn btn--primary">
          {t.cta}
        </a>
      </div>
    </Room>
  );
}
