/**
 * Маршрут камеры (план этажа — в route.ts). Поза — чистая функция прогресса участков скролла,
 * поэтому движение полностью обратимо и якоря попадают в нужное состояние.
 */
import { RAMP, READ_DRIFT, RISE, SEQUENCE, STAIRS, buildPlan, dirOf, type Plan, type RouteDoor } from "./route";

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
/** Мягкий разгон и торможение для длинных переходов: движение начинается сразу, без «пустого» скролла. */
const easeSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

function mix(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    yaw: lerp(a.yaw, b.yaw, t),
    pitch: lerp(a.pitch, b.pitch, t),
  };
}

/** Последовательные шаги; шаги могут перекрываться — каждый стартует от результата предыдущего. */
function chain(start: Pose, steps: { from: number; to: number; pose: Pose }[], p: number): Pose {
  let current = start;
  for (const step of steps) current = mix(current, step.pose, easeInOut(seg(p, step.from, step.to)));
  return current;
}

/* ---------- Кривая: прямые и дуги, движение с постоянной скоростью ---------- */

type Sample = Pose & { len: number };

class Curve {
  private samples: Sample[];

  constructor(start: Pose) {
    this.samples = [{ ...start, len: 0 }];
  }

  private get last() {
    return this.samples[this.samples.length - 1];
  }

  /** Текущий конец кривой. */
  get end(): Pose {
    return this.last;
  }

  /** extra — добавочная «длина» шага (поворот на месте), чтобы он занимал часть скролла. */
  private push(p: Pose, extra = 0) {
    const l = this.last;
    const len = l.len + Math.hypot(p.x - l.x, p.y - l.y, p.z - l.z) + extra;
    this.samples.push({ ...p, len });
  }

  /** Прямо к точке; pitch — наклон взгляда в конце отрезка (по умолчанию — ровно). */
  line(to: { x: number; y: number; z: number }, pitch = 0) {
    const from = this.last;
    const n = 8;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      this.push(pose(lerp(from.x, to.x, t), lerp(from.y, to.y, t), lerp(from.z, to.z, t), from.yaw, lerp(from.pitch, pitch, t)));
    }
    return this;
  }

  /**
   * Прямо к точке по горизонтали, высота плавно (smoothstep) меняется от from.y до toY
   * на участке [u0, u1] пути. Взгляд наклоняется по уклону (pitchScale) и возвращается — без рывков.
   */
  slope(to: { x: number; z: number }, toY: number, u0: number, u1: number, pitchScale: number) {
    const from = this.last;
    const n = 48;
    const horizontal = Math.hypot(to.x - from.x, to.z - from.z);
    const run = horizontal * (u1 - u0);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const u = clamp01((t - u0) / (u1 - u0));
      const y = lerp(from.y, toY, u * u * (3 - 2 * u));
      const grade = ((toY - from.y) / run) * 6 * u * (1 - u); // производная smoothstep → уклон
      this.push(pose(lerp(from.x, to.x, t), y, lerp(from.z, to.z, t), from.yaw, lerp(from.pitch, 0, Math.min(1, t * 4)) + Math.atan(grade) * pitchScale));
    }
    return this;
  }

  /**
   * Разворот на месте: turn = 1 — налево, −1 — направо. На длине пути поворот считается
   * как ход по дуге радиуса radius — это задаёт, сколько скролла он займёт.
   */
  turnInPlace(turn: 1 | -1, angle: number, radius: number) {
    const from = this.last;
    const n = 24;
    for (let i = 1; i <= n; i++) {
      const t = easeInOut(i / n);
      const prev = easeInOut((i - 1) / n);
      this.push(pose(from.x, from.y, from.z, from.yaw + turn * angle * t, from.pitch * (1 - t)), angle * radius * (t - prev));
    }
    return this;
  }

  /**
   * Плавный поворот к точке to: квадратичная кривая через угол corner (пересечение
   * текущего направления и направления входа в to). Взгляд — по касательной.
   */
  curveTo(corner: { x: number; z: number }, to: { x: number; y: number; z: number }) {
    const from = this.last;
    const n = 32;
    let yaw = from.yaw;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const a = (1 - t) * (1 - t);
      const b = 2 * (1 - t) * t;
      const c = t * t;
      // Касательная кривой Безье → yaw (dirOf(yaw) = (−sin, −cos)); разворачиваем к ближайшему к текущему.
      const tx = 2 * (1 - t) * (corner.x - from.x) + 2 * t * (to.x - corner.x);
      const tz = 2 * (1 - t) * (corner.z - from.z) + 2 * t * (to.z - corner.z);
      const raw = Math.atan2(-tx, -tz);
      yaw += Math.atan2(Math.sin(raw - yaw), Math.cos(raw - yaw));
      this.push(pose(a * from.x + b * corner.x + c * to.x, lerp(from.y, to.y, t), a * from.z + b * corner.z + c * to.z, yaw, from.pitch * (1 - t)));
    }
    return this;
  }

  /** Поза на доле длины u ∈ [0, 1]. */
  at(u: number): Pose {
    const target = clamp01(u) * this.last.len;
    let i = 1;
    while (i < this.samples.length - 1 && this.samples[i].len < target) i++;
    const a = this.samples[i - 1];
    const b = this.samples[i];
    return mix(a, b, b.len === a.len ? 1 : (target - a.len) / (b.len - a.len));
  }

  /** Доля пути, на которой камера впервые подходит к точке ближе, чем на distance (по горизонтали). */
  reach(point: { x: number; z: number }, distance: number): number {
    const hit = this.samples.find((s) => Math.hypot(s.x - point.x, s.z - point.z) < distance);
    return hit ? hit.len / this.last.len : 1;
  }
}

/* ---------- Маршрут из плана этажа ---------- */

const EYE = 1.65;

const eye = (p: { x: number; z: number }, level: number) => ({ x: p.x, y: level + EYE, z: p.z });

/** Камера смотрит на контент комнаты / дочитала блок (чуть подплыла к стене). */
function facing(plan: Plan, roomId: string): Pose {
  const r = plan.roomById[roomId];
  const e = eye(r.stand, r.level);
  return pose(e.x, e.y, e.z, r.contentYaw!);
}
function reading(plan: Plan, roomId: string): Pose {
  const r = plan.roomById[roomId];
  const d = dirOf(r.contentYaw!);
  const e = eye({ x: r.stand.x + d.x * READ_DRIFT, z: r.stand.z + d.z * READ_DRIFT }, r.level);
  return pose(e.x, e.y, e.z, r.contentYaw!, 0.01);
}

/** Точка на оси комнаты на расстоянии dist от центра по направлению yaw, на высоте глаз над level. */
function along(plan: Plan, roomId: string, yaw: number, dist: number, level: number) {
  const r = plan.roomById[roomId];
  const d = dirOf(yaw);
  return eye({ x: r.center.x + d.x * dist, z: r.center.z + d.z * dist }, level);
}

/** Из точки чтения сразу заворачиваем к боковой двери и выходим на APPROACH перед ней. */
function turnToSideDoor(c: Curve, door: RouteDoor, level: number) {
  const start = c.end;
  const s = dirOf(door.yaw);
  const approach = eye({ x: door.x - s.x * SIDE_APPROACH, z: door.z - s.z * SIDE_APPROACH }, level);
  // Угол кривой: на прямой взгляда из точки чтения, напротив двери.
  const d = dirOf(start.yaw);
  const ahead = (door.x - start.x) * d.x + (door.z - start.z) * d.z;
  const corner = { x: start.x + d.x * ahead, z: start.z + d.z * ahead };
  c.curveTo(corner, approach);
}
const SIDE_APPROACH = 1.6;

interface Passage {
  curve: Curve;
  /** Доли пути, между которыми открывается дверь. */
  open: [number, number];
}

/** Дверь открывается, пока камера подходит: начинает с 4.5 м, полностью открыта к 2 м. */
function openOnApproach(c: Curve, door: RouteDoor): [number, number] {
  const from = c.reach(door, 4.5);
  return [from - 0.04, Math.max(c.reach(door, 2), from + 0.05)];
}

/** Путь от «дочитали блок» до «стоим перед контентом следующей комнаты». */
function passage(plan: Plan, door: RouteDoor): Passage {
  const from = plan.roomById[door.from];
  const to = plan.roomById[door.to];
  const yaw = from.contentYaw!;
  const c = new Curve(reading(plan, door.from));

  switch (from.exit) {
    case "left":
    case "right":
      // Сразу плавно заворачиваем к боковой двери и проходим в следующую комнату.
      turnToSideDoor(c, door, from.level);
      c.line(eye(to.stand, to.level));
      return { curve: c, open: openOnApproach(c, door) };
    case "forward":
      // Коридор: прямо через дверь к точке чтения следующей комнаты.
      c.line(eye(to.stand, to.level));
      return { curve: c, open: openOnApproach(c, door) };
    case "up": {
      // Плавно поднимаемся по лестнице на площадку у двери и проходим.
      const start = plan.half - READ_DRIFT; // от стены до точки чтения
      const target = 0.9; // стоим на площадке перед дверью
      const u0 = (start - (STAIRS.depth + 0.3)) / (start - target);
      c.slope(along(plan, door.from, yaw, plan.half - target, 0), from.level + RISE + EYE, u0, 1, 0); // взгляд ровный, без наклона по уклону
      c.line(eye(to.stand, to.level));
      return { curve: c, open: openOnApproach(c, door) };
    }
    case "down": {
      // Подвал: одним плавным движением съезжаем по пандусу к двери; она открывается по пути.
      const start = plan.half - READ_DRIFT;
      const target = 0.8;
      const u0 = Math.max(0, (start - RAMP.length) / (start - target));
      const u1 = (start - RAMP.landing) / (start - target);
      c.slope(along(plan, door.from, yaw, plan.half - target, 0), from.level - RISE + EYE, u0, u1, 0); // взгляд ровный, без наклона по уклону
      c.line(eye(to.stand, to.level));
      return { curve: c, open: openOnApproach(c, door) };
    }
    default:
      throw new Error(`Комната ${door.from} без выхода`);
  }
}

/**
 * Финал: к двери, на улицу, до конца комнаты — там разворачиваемся на месте и смотрим, как закрывается дверь.
 * В коридоре (мобильные) — без разворота: просто выходим на улицу.
 */
function exitPassage(plan: Plan, door: RouteDoor): Passage {
  const from = plan.roomById[door.from];
  const to = plan.roomById[door.to];
  const out = dirOf(door.yaw);
  const c = new Curve(reading(plan, door.from));
  const straight = from.exit === "forward";
  if (!straight) turnToSideDoor(c, door, from.level);
  const farEnd = 2 * plan.outsideHalf - 2; // от двери до точки разворота у дальней стены
  c.line(eye({ x: door.x + out.x * farEnd, z: door.z + out.z * farEnd }, to.level));
  if (!straight) c.turnInPlace(-1, Math.PI, 1.6);
  return { curve: c, open: openOnApproach(c, door) };
}

interface Segment {
  track: string;
  camera: (p: number, layout: Layout) => Pose;
  /** Состояние дверей, которыми управляет участок. Поздние участки перекрывают ранние. */
  doors?: (p: number) => Record<string, number>;
  /** Какие комнаты рисовать: всегда три соседние (постоянное число источников света — без перекомпиляции шейдеров). */
  visible: string[];
}

const openBetween = (p: number, from: number, to: number) => easeInOut(seg(p, from, to));

function buildSegments(plan: Plan): Segment[] {
  const list: Segment[] = [];
  const seq = ["vestibule", ...SEQUENCE, "outside"];
  const window3 = (i: number) => {
    const start = Math.min(Math.max(i - 1, 0), seq.length - 3);
    return seq.slice(start, start + 3);
  };

  // Первый экран: подходим к двери, она открывается, входим в первую комнату.
  list.push({
    track: "hero",
    camera: (p, layout) =>
      chain(pose(layout.heroOffsetX, 1.75, layout.heroDistance, 0, 0.02), [
        { from: 0.06, to: 0.46, pose: pose(0, 1.7, 2.4) },
        { from: 0.56, to: 1, pose: facing(plan, "why") },
      ], p),
    doors: (p) => ({ hero: openBetween(p, 0.34, 0.6) }),
    visible: window3(0),
  });

  SEQUENCE.forEach((roomId, i) => {
    const idx = i + 1; // индекс в seq
    list.push({ track: roomId, camera: (p) => mix(facing(plan, roomId), reading(plan, roomId), p), visible: window3(idx) });

    const door = plan.doorAfter(roomId);
    const final = door.to === "outside";
    const { curve, open: [openFrom, openTo] } = final ? exitPassage(plan, door) : passage(plan, door);
    list.push({
      track: door.id,
      camera: (p) => curve.at(easeSine(p)),
      doors: (p) => {
        const open = openBetween(easeSine(p), openFrom, openTo);
        return { [door.id]: final ? open * (1 - openBetween(p, 0.8, 1)) : open };
      },
      visible: window3(idx + 1), // эта комната, следующая и та, что за ней
    });
  });

  return list;
}

export type Route = (tp: Record<string, number>, layout: Layout, reduced: boolean) => SceneState;

/** Маршрут камеры по плану: состояние сцены как функция прогресса участков скролла. */
export function createRoute(plan: Plan): Route {
  const segments = buildSegments(plan);

  return (tp, layout, reduced) => {
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
  };
}

/** Все id участков скролла, которые использует маршрут (для проверки разметки). Одинаковы для обоих планов. */
const trackPlan = buildPlan(false);
export const TRACKS = ["hero", ...SEQUENCE.flatMap((id) => [id, trackPlan.doorAfter(id).id])];
