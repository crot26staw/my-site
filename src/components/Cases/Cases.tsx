import { cases } from "@/config/cases";
import { Room } from "../Room/Room";
import { BeforeAfter } from "./BeforeAfter";
import s from "./Cases.module.css";

const isUrl = (v: string) => /^https?:\/\//.test(v);
const isImage = (v: string) => /^(\/|https?:)/.test(v);

export function Cases() {
  return (
    <Room
      id="cases"
      room="cases"
      index="05"
      title="Наши работы"
      lead="Каждый проект начинается с задачи клиента. Показываем, с чем к нам пришли и что получилось в итоге."
    >
      <ul className={s.grid}>
        {cases.map((c, i) => (
          <li key={`${c.title}-${i}`} className={s.card} data-reveal>
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
        ))}
      </ul>

      <p className="cta-line" data-reveal>
        <span>Хотите такой же результат? Расскажите о задаче, и мы покажем похожие проекты из вашей ниши.</span>
        <a href="#contact" className="btn btn--outline">
          Обсудить проект
        </a>
      </p>
    </Room>
  );
}
