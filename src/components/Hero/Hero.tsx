import { roomStyle } from "@/config/rooms";
import { getContent } from "@/lib/server/content";
import { ArrowDownIcon } from "../icons";
import s from "./Hero.module.css";

export async function Hero() {
  const t = (await getContent()).blocks.hero;

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
            {t.title} <span className={s.accent}>{t.titleAccent}</span>
          </h1>
          <p className={s.lead}>{t.lead}</p>
          <ul className={s.badges}>
            {t.badges.map((text) => (
              <li key={text} className={s.badge}>
                {text}
              </li>
            ))}
          </ul>
          <div className={s.actions}>
            <a href="#quiz" data-quiz className="btn btn--primary">
              {t.primaryCta}
            </a>
            <a href="#why" className="btn btn--ghost">
              {t.secondaryCta}
            </a>
          </div>
          <p className={s.note}>{t.note}</p>
        </div>
        <div className={s.hint} aria-hidden="true">
          <span>{t.scrollHint}</span>
          <ArrowDownIcon />
        </div>
      </div>
    </section>
  );
}
