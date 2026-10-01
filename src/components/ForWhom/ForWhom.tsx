import { getContent } from "@/lib/server/content";
import { TargetLink } from "../PageLink";
import { Room } from "../Room/Room";
import s from "./ForWhom.module.css";

export async function ForWhom() {
  const t = (await getContent()).blocks.forWhom;

  return (
    <Room id="for-whom" room="forWhom" index="02" title={t.title} lead={t.lead}>
      <ul className={s.grid}>
        {t.tiles.map((tile, i) => {
          // Ссылка на страницу — вся карточка кликабельна (card-link), на модалку — только сама ссылка
          const isPage = tile.link.startsWith("/");
          return (
            <li key={i} className={s.tile} data-reveal data-press data-card-link={isPage || undefined}>
              <span className={s.num} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={s.title}>{tile.title}</h3>
              <p className={s.pain}>
                <em>{tile.pain}</em>
              </p>
              <p className={s.solution}>{tile.solution}</p>
              <div className={s.footer}>
                <p className={s.price}>{tile.price}</p>
                <TargetLink target={tile.link} className={isPage ? `card-link ${s.link}` : s.link}>
                  {tile.linkLabel}
                  <span aria-hidden="true">→</span>
                </TargetLink>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="cta-line" data-reveal>
        <span>{t.ctaText}</span>
        <a href="#contact" data-lead="new" className="btn btn--outline">
          {t.ctaButton}
        </a>
      </p>
    </Room>
  );
}
