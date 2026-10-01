import { getContent } from "@/lib/server/content";
import { Room } from "../Room/Room";
import s from "./Why.module.css";

export async function Why() {
  const t = (await getContent()).blocks.why;
  const { columns } = t;

  return (
    <Room id="why" room="why" index="01" title={t.title} lead={t.lead}>
      <div className={s.columns}>
        <div className={`${s.column} ${s.columnAi}`} data-reveal>
          <h3 className={s.columnTitle}>{t.aiTitle}</h3>
          <ul className={s.list}>
            {t.aiTasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </div>
        <div className={`${s.column} ${s.columnHuman}`} data-reveal>
          <h3 className={s.columnTitle}>{t.humanTitle}</h3>
          <ul className={s.list}>
            {t.humanTasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className={s.summary} data-reveal>
        {t.summary}
      </p>

      <h3 className={s.compareTitle} data-reveal>
        {t.compareTitle}
      </h3>
      <div
        className={s.tableWrap}
        role="region"
        aria-label={`Сравнение: ${columns.freelancer}, ${columns.studio} и ${columns.us}`}
        tabIndex={0}
        data-reveal
      >
        <table className={s.table}>
          <thead>
            <tr>
              <td />
              <th scope="col">{columns.freelancer}</th>
              <th scope="col">{columns.studio}</th>
              <th scope="col" className={s.us}>
                {columns.us}
              </th>
            </tr>
          </thead>
          <tbody>
            {t.rows.map((row, i) => (
              <tr key={i}>
                <th scope="row">{row.label}</th>
                <td>{row.freelancer}</td>
                <td>{row.studio}</td>
                <td className={s.us}>{row.us}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={s.cta} data-reveal>
        <a href="#quiz" data-quiz className="btn btn--primary">
          {t.cta}
        </a>
      </div>
    </Room>
  );
}
