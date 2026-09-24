import { site, team } from "@/config/site";
import { Room } from "../Room/Room";
import s from "./Team.module.css";

export function Team() {
  const descriptions = [
    `Ваш главный контакт: обсуждает задачу, следит за сроками и держит вас в курсе на каждом этапе. Отвечает в мессенджере в течение ${site.responseMinutes} минут в рабочее время.`,
    "Ведёт проект от первого макета до запуска: создаёт дизайн, разрабатывает сайт и готовит его к продвижению в поиске. Поэтому ничего не теряется при передаче между специалистами, а сайт получается цельным.",
  ];
  const isImage = (v: string) => /^(\/|https?:)/.test(v);

  return (
    <Room
      id="team"
      room="team"
      index="08"
      title="Кто делает ваш сайт"
      lead="Мы небольшая команда, и это наше преимущество. Вы общаетесь напрямую с теми, кто работает над проектом: без менеджеров-посредников, испорченного телефона и лишних наценок. А AI-инструменты позволяют нам работать со скоростью большой студии."
    >
      <ul className={s.grid}>
        {team.members.map((m, i) => (
          <li key={i} className={s.card} data-reveal>
            <div className={s.photo}>
              {isImage(m.photo) ? (
                <img src={m.photo} alt={m.name} loading="lazy" decoding="async" />
              ) : (
                <span className={s.placeholder}>{m.photo}</span>
              )}
            </div>
            <div>
              <h3 className={s.name}>{m.name}</h3>
              <p className={s.role}>{m.role}</p>
              <p className={s.text}>{descriptions[i]}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className={s.facts} data-reveal>
        <span>
          <strong>{team.facts.projects}</strong> проектов запущено
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <strong>{team.facts.years}</strong> лет в веб-разработке
        </span>
      </p>

      <div data-reveal>
        <a href="#contact" data-lead="new" className="btn btn--primary">
          Познакомиться лично
        </a>
      </div>
    </Room>
  );
}
