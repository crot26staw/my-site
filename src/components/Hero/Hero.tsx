import { plans, fromPrice } from "@/config/site";
import { roomStyle } from "@/config/rooms";
import { ArrowDownIcon } from "../icons";
import s from "./Hero.module.css";

export function Hero() {
  const landing = plans.landing;
  const badges = [
    `${landing.title} ${fromPrice(landing.price)} и ${landing.term}`,
    "Сроки и цена фиксируются в договоре",
    "Поэтапная оплата: платите за готовый этап",
  ];

  return (
    <section
      id="hero"
      className={s.track}
      style={roomStyle("hero")}
      data-track="hero"
      data-track-mode="pin"
      data-fade-until="0.2"
      tabIndex={-1}
      aria-labelledby="hero-title"
    >
      <div className={s.stage}>
        <div className={s.content}>
          <p className="eyebrow" aria-hidden="true">// 00</p>
          <h1 id="hero-title" className={s.title}>
            Сайты под ключ быстрее и&nbsp;дешевле. <span className={s.accent}>И&nbsp;мы честно объясняем, почему</span>
          </h1>
          <p className={s.lead}>
            AI берёт на себя рутину, а дизайн, стратегию и контроль качества мы оставляем людям. Поэтому вы платите за
            результат, а не за часы работы.
          </p>
          <ul className={s.badges}>
            {badges.map((text) => (
              <li key={text} className={s.badge}>
                {text}
              </li>
            ))}
          </ul>
          <div className={s.actions}>
            <a href="#quiz" className="btn btn--primary">
              Рассчитать стоимость
            </a>
            <a href="#why" className="btn btn--ghost">
              Почему так выгодно?
            </a>
          </div>
          <p className={s.note}>
            Расчёт в течение часа в удобном вам мессенджере. Ни к чему не обязывает.
          </p>
        </div>
        <div className={s.hint} aria-hidden="true">
          <span>Листайте</span>
          <ArrowDownIcon />
        </div>
      </div>
    </section>
  );
}
