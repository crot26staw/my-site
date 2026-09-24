import { competitors, fromPrice, plans } from "@/config/site";
import { Room } from "../Room/Room";
import s from "./Why.module.css";

const aiTasks = [
  "Вёрстка типовых блоков и адаптация под мобильные",
  "Сбор и кластеризация семантического ядра",
  "Черновики текстов и мета-тегов",
  "Автоматическое тестирование и поиск ошибок",
];

const humanTasks = [
  "Анализ вашего бизнеса и аудитории",
  "Уникальный дизайн под ваш бренд",
  "Финальная редактура продающих текстов",
  "Контроль качества на каждом этапе",
];

export function Why() {
  const landing = plans.landing;
  const rows: [string, string, string, string][] = [
    ["Цена лендинга", competitors.freelancer.landingPrice, competitors.studio.landingPrice, fromPrice(landing.price)],
    ["Срок", "непредсказуемо", competitors.studio.term, landing.term],
    ["Договор и гарантии", "редко", "да", "да"],
    ["Дизайн, тексты и SEO", "обычно что-то одно", "за доплату", "в одном проекте"],
    ["Риск, что исполнитель пропадёт", "высокий", "низкий", "низкий: работаем по договору с фиксированными сроками"],
  ];

  return (
    <Room
      id="why"
      room="why"
      index="01"
      title="Честно о том, почему у нас быстрее и дешевле"
      lead="В обычной студии большую часть бюджета съедают рутинные задачи: типовая вёрстка, сбор ключевых запросов, черновики текстов, проверка ошибок. Мы автоматизировали эту рутину с помощью AI-инструментов, а время специалистов тратим на то, что действительно влияет на результат."
    >
      <div className={s.columns}>
        <div className={`${s.column} ${s.columnAi}`} data-reveal>
          <h3 className={s.columnTitle}>Что ускоряет AI</h3>
          <ul className={s.list}>
            {aiTasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className={`${s.column} ${s.columnHuman}`} data-reveal>
          <h3 className={s.columnTitle}>Что делают люди</h3>
          <ul className={s.list}>
            {humanTasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className={s.summary} data-reveal>
        AI не придумывает за нас ваш сайт. Он просто освобождает время, за которое вы в другом месте заплатили бы в
        несколько раз больше.
      </p>

      <h3 className={s.compareTitle} data-reveal>
        Сравните сами
      </h3>
      <div className={s.tableWrap} role="region" aria-label="Сравнение: фрилансер, веб-студия и мы" tabIndex={0} data-reveal>
        <table className={s.table}>
          <thead>
            <tr>
              <td />
              <th scope="col">Фрилансер</th>
              <th scope="col">Веб-студия</th>
              <th scope="col" className={s.us}>
                Мы
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, freelancer, studio, us]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{freelancer}</td>
                <td>{studio}</td>
                <td className={s.us}>{us}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={s.cta} data-reveal>
        <a href="#quiz" className="btn btn--primary">
          Рассчитать стоимость моего сайта
        </a>
      </div>
    </Room>
  );
}
