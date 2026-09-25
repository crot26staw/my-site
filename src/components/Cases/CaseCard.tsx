import type { Case } from "@/config/cases";
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
  return (
    <li className={s.card} data-reveal data-press>
      {c.beforeAfter ? (
        <BeforeAfter before={c.beforeAfter.before} after={c.beforeAfter.after} title={c.title} />
      ) : (
        <div className={s.media}>
          {isImage(c.image) ? (
            <img src={c.image} alt={`Сайт: ${c.title}`} loading="lazy" decoding="async" />
          ) : (
            <span className={s.placeholder}>{c.image}</span>
          )}
        </div>
      )}
      <div className={s.body}>
        <h3 className={s.title}>{c.title}</h3>
        <p className={s.row}>
          <strong>Задача:</strong> {c.task}
        </p>
        <p className={s.row}>
          <strong>Результат:</strong> {c.result}
        </p>
        {isUrl(c.url) ? (
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
