import { fromPrice, plans } from "@/config/site";
import { siteTypePath, siteTypes } from "@/config/siteTypes";
import { PageLink } from "../PageLink";
import { Room } from "../Room/Room";
import s from "./Pricing.module.css";

export function Pricing() {
  return (
    <Room
      id="pricing"
      room="pricing"
      index="04"
      title="Прозрачные цены без скрытых доплат"
      lead="Цена фиксируется в договоре и не меняется в процессе работы. Итоговая стоимость зависит от объёма и сложности проекта, точный расчёт сделаем после короткого обсуждения."
    >
      <ul className={s.track} aria-label="Тарифы">
        {siteTypes.map((t) => {
          const plan = plans[t.id];
          return (
            <li key={t.id} className={`${s.card} ${t.popular ? s.popular : ""}`} data-reveal data-press data-card-link>
              {t.popular && <span className={s.badge}>Популярный</span>}
              <h3 className={s.title}>{plan.title}</h3>
              <p className={s.price}>{fromPrice(plan.price)}</p>
              <p className={s.term}>{plan.term}</p>
              <p className={s.description}>
                <em>{t.description}</em>
              </p>
              <ul className={s.features}>
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <PageLink href={siteTypePath(t.id)} className={`card-link ${s.more}`}>
                Подробнее <span aria-hidden="true">→</span>
              </PageLink>
              <a href="#quiz" data-quiz data-plan={t.id} className={`btn ${t.popular ? "btn--primary" : "btn--outline"} ${s.cta}`}>
                {t.cta}
              </a>
            </li>
          );
        })}
      </ul>

      <p className="cta-line" data-reveal>
        <span>Не знаете, какой вариант подходит именно вам? Ответьте на 5 вопросов и получите расчёт стоимости.</span>
        <a href="#quiz" data-quiz className="btn btn--outline">
          Пройти тест за 1 минуту
        </a>
      </p>
    </Room>
  );
}
