import { roomStyle, type RoomId } from "@/config/rooms";
import s from "./Room.module.css";

interface RoomProps {
  /** id секции (якорь). */
  id: string;
  /** Комната: цвета неона и имя участка скролла для камеры. */
  room: RoomId;
  /** Декоративный номер комнаты. */
  index: string;
  title: string;
  lead?: string;
  /** Широкая панель — для блоков с многоколоночной раскладкой (тарифы, таймлайн). */
  wide?: boolean;
  /** Скрывать плавающую кнопку Telegram на мобильных, пока блок на экране (формы). */
  hideFab?: boolean;
  children: React.ReactNode;
}

/** Блок-комната: контент на неоновой панели поверх 3D-стены. */
export function Room({ id, room, index, title, lead, wide, hideFab, children }: RoomProps) {
  const titleId = `${id}-title`;
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
      <div className={`${s.panel} ${wide ? s.wide : ""}`}>
        <p className="eyebrow" aria-hidden="true">
          // {index}
        </p>
        <h2 id={titleId} className="section-title" data-reveal>
          {title}
        </h2>
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
