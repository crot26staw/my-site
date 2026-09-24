/**
 * План этажа: комнаты, двери и порядок обхода. Из этих данных строятся
 * и геометрия (world.ts), и маршрут камеры (path.ts).
 *
 * Комнаты стоят в сетке ячеек 12×12 м с шагом 12.4 м (0.4 — толщина стены).
 * yaw — куда смотрит камера: 0 — в −z, π/2 — в −x, −π/2 — в +x, ±π — в +z.
 * Увеличение yaw — поворот налево, уменьшение — направо.
 *
 * Правило прогулки: вошли → поворот к стене с контентом → поворот на 180° к двери
 * на противоположной стене → проход в следующую комнату.
 */
import type { RoomId } from "@/config/rooms";

const PI = Math.PI;
const HALF = PI / 2;
export const STEP = 12.4;
export const WALL = 0.4;
export const HALF_ROOM = 6;

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
  /** Где стоит камера после входа. */
  stand: { x: number; z: number };
  /** Куда смотреть на контент (нет у вестибюля). */
  contentYaw?: number;
  /** Где камера заканчивает «чтение» блока (по умолчанию — чуть ближе к стене с контентом). */
  readEnd?: { x: number; z: number };
  /** Надпись на стене напротив входа. */
  sign?: string;
  barsAlong?: "x" | "z";
}

export interface RouteDoor {
  id: string;
  /** Комната, из которой подходим (лицевая сторона двери смотрит в неё), и комната за дверью. */
  from: string;
  to: string;
  /** yaw камеры, смотрящей на дверь из комнаты from. */
  yaw: number;
  x: number;
  z: number;
  label?: string;
}

/** Направление взгляда по yaw. */
export const dirOf = (yaw: number) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });

const cell = (a: number, b: number) => ({ x: STEP * a, z: -6.4 - STEP * b });
const cellBounds = (c: { x: number; z: number }): Bounds => ({
  minX: c.x - HALF_ROOM,
  maxX: c.x + HALF_ROOM,
  minZ: c.z - HALF_ROOM,
  maxZ: c.z + HALF_ROOM,
});

const H = 4.6;

function room(id: string, colors: RoomId, at: { x: number; z: number }, contentYaw: number, sign: string, barsAlong: "x" | "z"): RouteRoom {
  return { id, colors, bounds: cellBounds(at), height: H, stand: at, contentYaw, sign, barsAlong };
}

// Балки на потолке ставим поперёк пути камеры (при входе они горизонтальны).
export const ROOMS: RouteRoom[] = [
  {
    id: "vestibule",
    colors: "hero",
    bounds: { minX: -5, maxX: 5, minZ: 0, maxZ: 11 },
    height: 4.4,
    stand: { x: 0, z: 6 },
    barsAlong: "x",
  },
  room("why", "why", cell(0, 0), -HALF, "ПОЧЕМУ БЫСТРЕЕ И ДЕШЕВЛЕ", "x"),
  room("forWhom", "forWhom", cell(-1, 0), PI, "ДЛЯ КОГО МЫ ДЕЛАЕМ САЙТЫ", "z"),
  room("services", "services", cell(-1, 1), -HALF, "ЧТО МЫ ДЕЛАЕМ", "x"),
  room("pricing", "pricing", cell(-2, 1), PI, "ЦЕНЫ", "z"),
  room("cases", "cases", cell(-2, 2), HALF, "НАШИ РАБОТЫ", "x"),
  room("process", "process", cell(-1, 2), -PI, "КАК МЫ РАБОТАЕМ", "z"),
  room("quiz", "quiz", cell(-1, 3), HALF, "КАЛЬКУЛЯТОР", "x"),
  room("team", "team", cell(0, 3), 0, "КОМАНДА", "z"),
  room("guarantees", "guarantees", cell(0, 2), -1.5 * PI, "ГАРАНТИИ", "x"),
  room("faq", "faq", cell(1, 2), 0, "ВОПРОСЫ", "z"),
  // Длинный зал вдоль первой комнаты: входим с дальнего конца, идём вдоль него к выходу в «Почему».
  {
    id: "contact",
    colors: "contact",
    bounds: { minX: -HALF_ROOM, maxX: STEP + HALF_ROOM, minZ: cell(0, 1).z - HALF_ROOM, maxZ: cell(0, 1).z + HALF_ROOM },
    height: H,
    stand: cell(1, 1),
    contentYaw: -1.5 * PI,
    readEnd: cell(0, 1),
    sign: "КОНТАКТЫ",
    barsAlong: "z",
  },
];

export const roomById = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<string, RouteRoom>;

/** Порядок обхода. Трек участка чтения = id комнаты, трек перехода = id двери. */
export const SEQUENCE = ["why", "forWhom", "services", "pricing", "cases", "process", "quiz", "team", "guarantees", "faq", "contact"];

/** Дверь на стене комнаты from в направлении yaw. */
function passageDoor(id: string, from: string, to: string, yaw: number, label: string): RouteDoor {
  const r = roomById[from];
  const d = dirOf(yaw);
  const reach = HALF_ROOM + WALL / 2;
  return { id, from, to, yaw, x: r.stand.x + d.x * reach, z: r.stand.z + d.z * reach, label };
}

export const DOORS: RouteDoor[] = [
  { id: "hero", from: "vestibule", to: "why", yaw: 0, x: 0, z: -WALL / 2, label: "01 // ВХОД" },
  passageDoor("door2", "why", "forWhom", HALF, "02 // ДЛЯ КОГО"),
  passageDoor("door3", "forWhom", "services", 0, "03 // УСЛУГИ"),
  passageDoor("door4", "services", "pricing", HALF, "04 // ЦЕНЫ"),
  passageDoor("door5", "pricing", "cases", 0, "05 // КЕЙСЫ"),
  passageDoor("door6", "cases", "process", -HALF, "06 // ПРОЦЕСС"),
  passageDoor("door7", "process", "quiz", 0, "07 // КАЛЬКУЛЯТОР"),
  passageDoor("door8", "quiz", "team", -HALF, "08 // КОМАНДА"),
  passageDoor("door9", "team", "guarantees", -PI, "09 // ГАРАНТИИ"),
  passageDoor("door10", "guarantees", "faq", -HALF, "10 // ВОПРОСЫ"),
  passageDoor("door11", "faq", "contact", -PI, "11 // КОНТАКТЫ"),
  // Из зала «Контакты» обратно в первую комнату — и дальше на выход через входную дверь.
  { id: "exit", from: "contact", to: "why", yaw: -PI, x: 0, z: roomById.why.bounds.minZ - WALL / 2, label: "ВЫХОД" },
];

/** Дверь, ведущая из комнаты дальше по маршруту. */
export const doorAfter = (roomId: string) => DOORS.find((d) => d.from === roomId && d.id !== "hero")!;
