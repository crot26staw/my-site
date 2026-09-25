import { roomStyle, type RoomId } from "@/config/rooms";
import { Breadcrumbs, type Crumb } from "../Breadcrumbs/Breadcrumbs";
import s from "./Room.module.css";

type RoomProps = {
  /** id секции (якорь). */
  id: string;
  /** Комната: цвета неона и имя участка скролла для камеры. */
  room: RoomId;
  title: string;
  lead?: string;
  /** Скрывать плавающую кнопку Telegram на мобильных, пока блок на экране (формы). */
  hideFab?: boolean;
  children: React.ReactNode;
} & (
  | { /** Декоративный номер комнаты (блок на главной). */ index: string; breadcrumbs?: never }
  | {
      /** Блок, который и есть вся страница: крошки вместо номера, заголовок — h1. */
      breadcrumbs: Crumb[];
      index?: never;
    }
);

/** Блок-комната: контент на неоновой панели поверх 3D-стены. */
export function Room({ id, room, index, breadcrumbs, title, lead, hideFab, children }: RoomProps) {
  const titleId = `${id}-title`;
  const Heading = breadcrumbs ? "h1" : "h2";
  return (
    <section
      id={id}
      className={s.room}
      style={roomStyle(room)}
      data-track={room}
      data-track-mode="pin"
      data-hide-fab={hideFab || undefined}
      tabIndex={-1}
      aria-labelledby={titleId}
    >
      <div className={s.panel}>
        {breadcrumbs ? (
          <Breadcrumbs items={breadcrumbs} />
        ) : (
          <p className="eyebrow" aria-hidden="true">
            // {index}
          </p>
        )}
        <Heading id={titleId} className="section-title" data-reveal>
          {title}
        </Heading>
        {lead && (
          <p className="section-lead" data-reveal>
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

/** Пустой участок скролла, пока камера идёт в следующую комнату. */
export function Passage({ track, long }: { track: string; long?: boolean }) {
  return <div className={`passage ${long ? "passage--long" : ""}`} data-track={track} data-track-mode="enter" aria-hidden="true" />;
}
