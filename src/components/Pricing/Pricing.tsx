import { fromPrice, plansOf } from "@/lib/format";
import { siteTypePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { PageLink } from "../PageLink";
import { Room } from "../Room/Room";
import s from "./Pricing.module.css";

export async function Pricing() {
  const { siteTypes, blocks } = await getContent();
  const t = blocks.pricing;
  const plans = plansOf(siteTypes);

  return (
    <Room id="pricing" room="pricing" index="04" title={t.title} lead={t.lead}>
      <ul className={s.track} aria-label="Тарифы">
        {siteTypes.map((type) => {
          const plan = plans[type.id];
          return (
            <li key={type.id} className={`${s.card} ${type.popular ? s.popular : ""}`} data-reveal data-press data-card-link>
              {type.popular && <span className={s.badge}>{t.popularBadge}</span>}
              <h3 className={s.title}>{plan.title}</h3>
              <p className={s.price}>{fromPrice(plan.price)}</p>
              <p className={s.term}>{plan.term}</p>
              <p className={s.description}>
                <em>{type.description}</em>
              </p>
              <ul className={s.features}>
                {type.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <PageLink href={siteTypePath(type.id)} className={`card-link ${s.more}`}>
                {t.moreLabel} <span aria-hidden="true">→</span>
              </PageLink>
              <a
                href="#quiz"
                data-quiz
                data-plan={type.id}
                className={`btn ${type.popular ? "btn--primary" : "btn--outline"} ${s.cta}`}
              >
                {type.cta}
              </a>
            </li>
          );
        })}
      </ul>

      <p className="cta-line" data-reveal>
        <span>{t.ctaText}</span>
        <a href="#quiz" data-quiz className="btn btn--outline">
          {t.ctaButton}
        </a>
      </p>
    </Room>
  );
}
