/**
 * Маршрут камеры (план этажа — в route.ts). Поза — чистая функция прогресса участков скролла,
 * поэтому движение полностью обратимо и якоря попадают в нужное состояние.
 */
import { DOORS, SEQUENCE, dirOf, doorAfter, roomById, type RouteDoor } from "./route";

export interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

export interface SceneState {
  pose: Pose;
  /** Открытость дверей по id: 0 — закрыта, 1 — открыта. */
  doors: Record<string, number>;
  /** 1 — камера в исходной позиции первого экрана, 0 — ушла от неё. */
  intro: number;
  /** Какие комнаты сейчас рисовать. */
  visible: string[];
}

export interface Layout {
  /** Смещение камеры на первом экране, чтобы дверь стояла справа от текста. */
  heroOffsetX: number;
  heroDistance: number;
  /** Сдвиг кадра вверх (доля высоты) на первом экране: на узких экранах дверь над текстом. */
  heroShiftY: number;
}

const pose = (x: number, y: number, z: number, yaw = 0, pitch = 0): Pose => ({ x, y, z, yaw, pitch });

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mix(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    yaw: lerp(a.yaw, b.yaw, t),
    pitch: lerp(a.pitch, b.pitch, t),
  };
}

interface Step {
  from: number;
  to: number;
  pose: Pose;
}

/** Последовательные шаги; шаги могут перекрываться — каждый стартует от результата предыдущего. */
function chain(start: Pose, steps: Step[], p: number): Pose {
  let current = start;
  for (const step of steps) {
    current = mix(current, step.pose, easeInOut(seg(p, step.from, step.to)));
  }
  return current;
}

/* ---------- Маршрут из плана этажа ---------- */

const EYE = 1.65;
const APPROACH = 3.1; // с какого расстояния смотрим на дверь перед открытием
const READ_DRIFT = 0.6; // насколько камера подплывает к стене, пока читаем блок

const at = (p: { x: number; z: number }, yaw: number, pitch = 0) => pose(p.x, EYE, p.z, yaw, pitch);

/** Камера смотрит на контент комнаты / дочитала блок. */
function facing(roomId: string): Pose {
  const r = roomById[roomId];
  return at(r.stand, r.contentYaw!);
}
function reading(roomId: string): Pose {
  const r = roomById[roomId];
  if (r.readEnd) return at(r.readEnd, r.contentYaw!, 0.01);
  const d = dirOf(r.contentYaw!);
  return at({ x: r.stand.x + d.x * READ_DRIFT, z: r.stand.z + d.z * READ_DRIFT }, r.contentYaw!, 0.01);
}

/**
 * Переход «поворот к двери → дверь открывается → проход → поворот к контенту».
 * Тайминги одинаковые у всех переходов, чтобы ритм прогулки был ровным.
 */
function passageSteps(door: RouteDoor): Step[] {
  const from = reading(door.from);
  const to = roomById[door.to];
  const d = dirOf(door.yaw);
  return [
    { from: 0, to: 0.3, pose: { ...from, yaw: door.yaw, pitch: 0 } },
    { from: 0.26, to: 0.5, pose: at({ x: door.x - d.x * APPROACH, z: door.z - d.z * APPROACH }, door.yaw) },
    { from: 0.56, to: 0.84, pose: at(to.stand, door.yaw) },
    { from: 0.8, to: 1, pose: at(to.stand, to.contentYaw!) },
  ];
}
const PASSAGE_DOOR = { from: 0.38, to: 0.6 };

interface Segment {
  track: string;
  camera: (p: number, layout: Layout) => Pose;
  /** Состояние дверей, которыми управляет участок. Поздние участки перекрывают ранние. */
  doors?: (p: number) => Record<string, number>;
  /** Какие комнаты рисовать: всегда три соседние (постоянное число источников света — без перекомпиляции шейдеров). */
  visible: string[];
}

const openBetween = (p: number, from: number, to: number) => easeInOut(seg(p, from, to));

function buildSegments(): Segment[] {
  const list: Segment[] = [];
  const seq = ["vestibule", ...SEQUENCE];
  const window3 = (i: number) => {
    const start = Math.min(Math.max(i - 1, 0), seq.length - 3);
    return seq.slice(start, start + 3);
  };

  // Первый экран: подходим к двери, она открывается, входим, поворот направо.
  list.push({
    track: "hero",
    camera: (p, layout) =>
      chain(pose(layout.heroOffsetX, 1.75, layout.heroDistance, 0, 0.02), [
        { from: 0.06, to: 0.44, pose: pose(0, 1.7, 2.4) },
        { from: 0.56, to: 0.82, pose: at({ x: roomById.why.stand.x, z: roomById.why.stand.z + 0.4 }, 0) },
        { from: 0.78, to: 1, pose: facing("why") },
      ], p),
    doors: (p) => ({ hero: openBetween(p, 0.34, 0.6) }),
    visible: window3(0),
  });

  SEQUENCE.forEach((roomId, i) => {
    const idx = i + 1; // индекс в seq
    list.push({ track: roomId, camera: (p) => mix(facing(roomId), reading(roomId), p), visible: window3(idx) });
    const next = SEQUENCE[i + 1];
    if (!next) return;
    const door = doorAfter(roomId);
    const steps = passageSteps(door);
    list.push({
      track: door.id,
      camera: (p) => chain(reading(roomId), steps, p),
      doors: (p) => ({ [door.id]: openBetween(p, PASSAGE_DOOR.from, PASSAGE_DOOR.to) }),
      visible: seq.slice(idx, idx + 3).length === 3 ? seq.slice(idx, idx + 3) : window3(idx),
    });
  });

  // Финал: из зала «Контакты» через первую комнату к входной двери, выходим и оборачиваемся — дверь закрывается.
  const hall = reading("contact");
  const exitDoor = DOORS.find((d) => d.id === "exit")!;
  list.push({
    track: "exit",
    camera: (p) =>
      chain(hall, [
        { from: 0, to: 0.18, pose: { ...hall, yaw: exitDoor.yaw, pitch: 0 } },
        { from: 0.14, to: 0.3, pose: at({ x: exitDoor.x, z: exitDoor.z - APPROACH }, exitDoor.yaw) },
        { from: 0.36, to: 0.6, pose: at({ x: 0, z: -3.4 }, exitDoor.yaw) },
        { from: 0.6, to: 0.8, pose: pose(0, 1.7, 6.2, exitDoor.yaw) },
        { from: 0.78, to: 1, pose: pose(0, 1.72, 6.6, exitDoor.yaw - Math.PI, 0.02) },
      ], p),
    doors: (p) => ({
      exit: openBetween(p, 0.22, 0.4),
      hero: openBetween(p, 0.48, 0.62) * (1 - openBetween(p, 0.86, 1)),
    }),
    visible: ["contact", "why", "vestibule"],
  });

  return list;
}

const segments = buildSegments();

export function evaluate(tp: Record<string, number>, layout: Layout, reduced: boolean): SceneState {
  const progress = (track: string) => {
    const p = tp[track] ?? 0;
    return reduced ? (p < 0.5 ? 0 : 1) : p;
  };

  // Активен последний начавшийся участок; концы соседних участков совпадают, поэтому стыков не видно.
  let active = segments[0];
  const doors: Record<string, number> = {};
  for (const s of segments) {
    const p = progress(s.track);
    if (p > 0) active = s;
    if (s.doors && (p > 0 || s === segments[0])) Object.assign(doors, s.doors(p));
  }

  return {
    pose: active.camera(progress(active.track), layout),
    doors,
    visible: active.visible,
    intro: active === segments[0] ? 1 - easeInOut(seg(progress("hero"), 0.02, 0.36)) : 0,
  };
}

/** Все id участков скролла, которые использует маршрут (для проверки разметки). */
export const TRACKS = segments.map((s) => s.track);
