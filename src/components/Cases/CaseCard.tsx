import { type Case, casePath } from "@/config/cases";
import { asset } from "@/lib/asset";
import { BeforeAfter } from "./BeforeAfter";
import s from "./Cases.module.css";

const isUrl = (v: string) => /^https?:\/\//.test(v);
const isImage = (v: string) => /^(\/|https?:)/.test(v);

/** Сетка карточек кейсов — общая для главной и страницы /cases. */
export function CaseGrid({ items }: { items: Case[] }) {
  return (
    <ul className={s.grid}>
      {items.map((c, i) => (
        <CaseCard key={`${c.title}-${i}`} item={c} />
      ))}
    </ul>
  );
}

function CaseCard({ item: c }: { item: Case }) {
  // Кейс с подробной страницей: карточка целиком — ссылка на неё (открывается модалкой, src/components/Cases/CaseModal.tsx)
  const detail = c.slug && c.details ? asset(casePath(c.slug)) : null;
  return (
    <li className={detail ? `${s.card} ${s.linked}` : s.card} data-reveal data-press>
      {c.beforeAfter ? (
        <BeforeAfter before={c.beforeAfter.before} after={c.beforeAfter.after} title={c.title} />
      ) : (
        <div className={s.media}>
          {isImage(c.image) ? (
            <img src={asset(c.image)} alt={`Сайт: ${c.title}`} loading="lazy" decoding="async" />
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
          <strong>Задача:</strong> {c.task}
        </p>
        <p className={s.row}>
          <strong>Результат:</strong> {c.result}
        </p>
        {detail ? (
          // Декоративная кнопка: клик по ней попадает в ссылку-обложку заголовка
          <span className={`btn btn--outline ${s.cta}`} aria-hidden="true">
            Подробнее о проекте
          </span>
        ) : isUrl(c.url) ? (
          <a href={c.url} target="_blank" rel="noopener" className={`btn btn--outline ${s.cta}`}>
            Посмотреть сайт
          </a>
        ) : (
          // Ссылка ещё не заполнена: кнопка неактивна, плейсхолдер виден в title
          <span className={`btn btn--outline ${s.cta} ${s.disabled}`} aria-disabled="true" title={c.url}>
            Посмотреть сайт
          </span>
        )}
      </div>
    </li>
  );
}
