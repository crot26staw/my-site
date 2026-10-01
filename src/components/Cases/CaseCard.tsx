import type { Case, Pages } from "@/content/types";
import { asset } from "@/lib/asset";
import { casePath, isImage, isUrl } from "@/lib/paths";
import { BeforeAfter } from "./BeforeAfter";
import s from "./Cases.module.css";

type Labels = Pick<Pages["cases"], "cardTask" | "cardResult" | "cardMore" | "viewSite">;

/** Сетка карточек кейсов — общая для главной и страницы /cases. */
export function CaseGrid({ items, labels }: { items: Case[]; labels: Labels }) {
  return (
    <ul className={s.grid}>
      {items.map((c, i) => (
        <CaseCard key={`${c.title}-${i}`} item={c} labels={labels} />
      ))}
    </ul>
  );
}

function CaseCard({ item: c, labels }: { item: Case; labels: Labels }) {
  // Кейс с подробной страницей: карточка целиком — ссылка на неё (открывается модалкой, src/components/Cases/CaseModal.tsx)
  const detail = c.slug && c.details ? asset(casePath(c.slug)) : null;
  return (
    <li className={detail ? `${s.card} ${s.linked}` : s.card} data-reveal data-press>
      {c.beforeAfter ? (
        <BeforeAfter before={c.beforeAfter.before ?? ""} after={c.beforeAfter.after ?? ""} title={c.title} />
      ) : (
        <div className={s.media}>
          {c.image && isImage(c.image) ? (
            // Превью 600×600 (обрезается при загрузке в админке): место под картинку занято до загрузки
            <img
              src={asset(c.image)}
              alt={`Сайт: ${c.title}`}
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className={s.placeholder}>{c.image}</span>
          )}
        </div>
      )}
      <div className={s.body}>
        <h3 className={s.title}>
          {detail ? (
            <a href={detail} data-case={c.slug} className={s.cover}>
              {c.title}
            </a>
          ) : (
            c.title
          )}
        </h3>
        <p className={s.row}>
          <strong>{labels.cardTask}</strong> {c.task}
        </p>
        <p className={s.row}>
          <strong>{labels.cardResult}</strong> {c.result}
        </p>
        {detail ? (
          // Декоративная кнопка: клик по ней попадает в ссылку-обложку заголовка
          <span className={`btn btn--outline ${s.cta}`} aria-hidden="true">
            {labels.cardMore}
          </span>
        ) : isUrl(c.url) ? (
          <a href={c.url} target="_blank" rel="noopener" className={`btn btn--outline ${s.cta}`}>
            {labels.viewSite}
          </a>
        ) : (
          // Ссылка ещё не заполнена: кнопка неактивна, плейсхолдер виден в title
          <span className={`btn btn--outline ${s.cta} ${s.disabled}`} aria-disabled="true" title={c.url}>
            {labels.viewSite}
          </span>
        )}
      </div>
    </li>
  );
}
