/**
 * План этажа: комнаты, двери и порядок обхода. Из этих данных строятся
 * и геометрия (world.ts), и маршрут камеры (path.ts).
 *
 * yaw — куда смотрит камера: 0 — в −z, π/2 — в −x, −π/2 — в +x, ±π — в +z.
 * Увеличение yaw — поворот налево, уменьшение — направо.
 *
 * Прогулка повторяет цикл из четырёх комнат (DESKTOP.pattern):
 *   left  — дверь в левой стене: читаем блок ближе ко входу и сразу плавно заворачиваем к двери;
 *   up    — дверь прямо, к ней лестница вверх, следующая комната выше;
 *   right — то же с дверью справа;
 *   down  — пандус в подвал от середины комнаты, внизу дверь в следующую комнату.
 * Контент комнаты всегда на стене впереди при входе. Комнаты расставляются
 * по маршруту: вход в каждую — по центру её стены.
 *
 * На мобильных (MOBILE_QUERY) — упрощённый план: плоский коридор из комнат поменьше,
 * все двери прямо (forward), без поворотов, лестниц и пандусов. Переходы короче.
 */
import type { RoomId } from "@/config/rooms";

const PI = Math.PI;
const HALF = PI / 2;
export const WALL = 0.4;
/** Полуразмер комнаты на десктопе; от него отсчитаны боковые двери, лестница и пандус. */
const HALF_ROOM = 6;
/** Перепад между этажами (лестница). */
export const RISE = 1;
/** Боковая дверь: насколько дальше центра комнаты она стоит. */
export const SIDE_DOOR_DEPTH = 3.6;
/** В комнате с боковой дверью камера останавливается ближе ко входу — отсюда видна вся стена с контентом. */
export const SIDE_STAND_BACK = 4.8;
/** Лестница: площадка у двери и ступени до пола. */
export const STAIRS = {
  steps: 5,
  landing: 0.7,
  run: 0.45,
  width: 4.2,
  get depth() {
    return this.landing + (this.steps - 1) * this.run;
  },
};
/** Пандус в подвал: от середины комнаты к двери, внизу короткая площадка. */
export const RAMP = {
  width: 4.2,
  /** От стены с дверью до верха пандуса (чуть дальше центра комнаты). */
  length: HALF_ROOM - 1,
  landing: 1.2,
};
/** Насколько камера подплывает к стене с контентом, пока читаем блок. */
export const READ_DRIFT = 0.6;

export type ExitKind = "left" | "up" | "right" | "down" | "forward";

/** Та же граница, что и в CSS (.passage в globals.css, .track в Hero.module.css). */
export const MOBILE_QUERY = "(max-width: 767px), (pointer: coarse)";

interface Profile {
  pattern: ExitKind[];
  /** Полуразмер комнаты. */
  half: number;
  /** Финальная комната («улица» с футером) меньше остальных. */
  outsideHalf: number;
  height: number;
}

const DESKTOP: Profile = { pattern: ["left", "up", "right", "down"], half: HALF_ROOM, outsideHalf: 4.5, height: 5.6 };
const MOBILE: Profile = { pattern: ["forward"], half: 4, outsideHalf: 3.5, height: 4.8 };

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RouteRoom {
  id: string;
  colors: RoomId;
  bounds: Bounds;
  height: number;
  /** Высота пола (мировая). */
  level: number;
  center: { x: number; z: number };
  /** Где стоит камера, пока читаем блок; contentYaw — куда она смотрит (там же контент). */
  stand: { x: number; z: number };
  contentYaw?: number;
  exit?: ExitKind;
  /** У дальней стены: лестница вверх к двери или пандус вниз в подвал к двери. */
  stairs?: "up" | "down";
  /** Надпись над контентом (только на стене без двери). */
  sign?: string;
  barsAlong: "x" | "z";
}

export interface RouteDoor {
  id: string;
  /** Комната, из которой подходим (лицевая сторона двери смотрит в неё), и комната за дверью. */
  from: string;
  to: string;
  /** Направление прохода через дверь (yaw). */
  yaw: number;
  x: number;
  z: number;
  /** Низ проёма (мировая высота). */
  y: number;
  label?: string;
  /** Надпись на обратной стороне (видна после прохода). */
  labelBack?: string;
}

/** Направление взгляда по yaw. */
export const dirOf = (yaw: number) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });

const boundsAround = (c: { x: number; z: number }, half: number): Bounds => ({
  minX: c.x - half,
  maxX: c.x + half,
  minZ: c.z - half,
  maxZ: c.z + half,
});

/** Балки на потолке — поперёк направления движения. */
const barsAcross = (yaw: number): "x" | "z" => (Math.abs(dirOf(yaw).z) > 0.5 ? "x" : "z");

/** Порядок обхода. Трек участка чтения = id комнаты, трек перехода = id двери. */
export const SEQUENCE = ["why", "forWhom", "services", "pricing", "cases", "process", "quiz", "team", "guarantees", "faq", "contact"];

const LABELS: Record<string, string> = {
  forWhom: "ДЛЯ КОГО",
  services: "УСЛУГИ",
  pricing: "ЦЕНЫ",
  cases: "КЕЙСЫ",
  process: "ПРОЦЕСС",
  quiz: "КАЛЬКУЛЯТОР",
  team: "КОМАНДА",
  guarantees: "ГАРАНТИИ",
  faq: "ВОПРОСЫ",
  contact: "КОНТАКТЫ",
};

const SIGNS: Record<string, string> = {
  why: "ПОЧЕМУ БЫСТРЕЕ И ДЕШЕВЛЕ",
  services: "ЧТО МЫ ДЕЛАЕМ",
  cases: "НАШИ РАБОТЫ",
  quiz: "КАЛЬКУЛЯТОР",
  guarantees: "ГАРАНТИИ",
  contact: "КОНТАКТЫ",
};

export interface Plan {
  rooms: RouteRoom[];
  doors: RouteDoor[];
  roomById: Record<string, RouteRoom>;
  /** Дверь, ведущая из комнаты дальше по маршруту. */
  doorAfter: (roomId: string) => RouteDoor;
  half: number;
  outsideHalf: number;
}

export function buildPlan(mobile: boolean): Plan {
  const { pattern, half, outsideHalf, height } = mobile ? MOBILE : DESKTOP;
  const rooms: RouteRoom[] = [
    {
      id: "vestibule",
      colors: "hero",
      bounds: { minX: -5, maxX: 5, minZ: 0, maxZ: 11 },
      height: 4.4,
      level: 0,
      center: { x: 0, z: 5.5 },
      stand: { x: 0, z: 6 },
      barsAlong: "x",
    },
  ];
  const doors: RouteDoor[] = [{ id: "hero", from: "vestibule", to: "why", yaw: 0, x: 0, z: -WALL / 2, y: 0, label: "01 // ВХОД" }];

  // Текущая комната: центр, направление движения при входе, уровень пола.
  const reach = half + WALL / 2;
  let center = { x: 0, z: -WALL - half };
  let yaw = 0;
  let level = 0;

  // После последней комнаты — «улица», куда выходим в финале.
  const ids = [...SEQUENCE, "outside"];
  ids.forEach((id, i) => {
    const isOutside = id === "outside";
    const exit = isOutside ? undefined : pattern[i % pattern.length];
    const d = dirOf(yaw);
    rooms.push({
      id,
      colors: isOutside ? "hero" : (id as RoomId),
      bounds: boundsAround(center, isOutside ? outsideHalf : half),
      height,
      level,
      center,
      stand:
        exit === "left" || exit === "right"
          ? { x: center.x - d.x * SIDE_STAND_BACK, z: center.z - d.z * SIDE_STAND_BACK }
          : center,
      contentYaw: isOutside ? undefined : yaw,
      exit,
      stairs: exit === "up" || exit === "down" ? exit : undefined,
      sign: SIGNS[id],
      barsAlong: barsAcross(yaw),
    });
    if (!exit) return;

    const next = ids[i + 1];
    const toOutside = next === "outside";

    let doorPos: { x: number; z: number };
    let doorYaw = yaw;
    let doorY = level;
    let nextLevel = level;
    if (exit === "left" || exit === "right") {
      // Дверь в боковой стене, ближе к дальней стене.
      doorYaw = yaw + (exit === "left" ? HALF : -HALF);
      const side = dirOf(doorYaw);
      doorPos = {
        x: center.x + d.x * SIDE_DOOR_DEPTH + side.x * reach,
        z: center.z + d.z * SIDE_DOOR_DEPTH + side.z * reach,
      };
    } else {
      doorPos = { x: center.x + d.x * reach, z: center.z + d.z * reach };
      if (exit !== "forward") doorY = nextLevel = level + (exit === "up" ? RISE : -RISE);
    }
    doors.push({
      id: toOutside ? "exit" : `door${i + 2}`,
      from: id,
      to: next,
      yaw: doorYaw,
      ...doorPos,
      y: doorY,
      label: toOutside ? "ВЫХОД" : `${String(i + 2).padStart(2, "0")} // ${LABELS[next]}`,
      labelBack: toOutside ? "ВЫХОД" : undefined,
    });

    const nd = dirOf(doorYaw);
    const nextReach = toOutside ? outsideHalf + WALL / 2 : reach;
    center = { x: doorPos.x + nd.x * nextReach, z: doorPos.z + nd.z * nextReach };
    yaw = doorYaw;
    level = nextLevel;
  });

  return {
    rooms,
    doors,
    roomById: Object.fromEntries(rooms.map((r) => [r.id, r])),
    doorAfter: (roomId) => doors.find((d) => d.from === roomId)!,
    half,
    outsideHalf,
  };
}
