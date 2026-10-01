import { isImage } from "@/lib/paths";
import { asset } from "@/lib/asset";
import { getContent } from "@/lib/server/content";
import { Room } from "../Room/Room";
import s from "./Team.module.css";

export async function Team() {
  const { team, blocks } = await getContent();
  const t = blocks.team;

  return (
    <Room id="team" room="team" index="08" title={t.title} lead={t.lead}>
      <ul className={s.grid}>
        {team.members.map((m, i) => (
          <li key={i} className={s.card} data-reveal>
            <div className={s.photo}>
              {m.photo && isImage(m.photo) ? (
                <img src={asset(m.photo)} alt={m.name} loading="lazy" decoding="async" />
              ) : (
                <span className={s.placeholder}>{m.photo}</span>
              )}
            </div>
            <div>
              <h3 className={s.name}>{m.name}</h3>
              <p className={s.role}>{m.role}</p>
              <p className={s.text}>{m.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className={s.facts} data-reveal>
        <span>
          <strong>{team.facts.projects}</strong> {t.projectsLabel}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <strong>{team.facts.years}</strong> {t.yearsLabel}
        </span>
      </p>

      <div data-reveal>
        <a href="#contact" data-lead="new" className="btn btn--primary">
          {t.cta}
        </a>
      </div>
    </Room>
  );
}
