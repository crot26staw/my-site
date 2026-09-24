import * as THREE from "three";
import { box, materials, neon, strip, wallGeometry, type Opening } from "./kit";

export type WallSide = "zMin" | "zMax" | "xMin" | "xMax";

export interface RoomSpec {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  color: string;
  color2: string;
  /** Проёмы: center — мировая координата вдоль стены (x для z-стен, z для x-стен). */
  openings?: Partial<Record<WallSide, { center: number; width: number; height: number; bottom?: number }[]>>;
  /** Стены без декоративных панелей (например, стена под HTML-контент). */
  plainWalls?: WallSide[];
  /** Направление световых балок на потолке; по умолчанию вдоль длинной стороны. */
  barsAlong?: "x" | "z";
  /** Проём в полу (лестница в подвал). */
  floorHole?: { minX: number; maxX: number; minZ: number; maxZ: number };
}

/**
 * Коробка комнаты с неоновыми плинтусами, карнизами, угловыми полосами,
 * световыми балками и цветным светом.
 */
export function buildRoom(spec: RoomSpec): THREE.Group {
  const g = new THREE.Group();
  const { minX, maxX, minZ, maxZ, height: h } = spec;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const w = maxX - minX;
  const d = maxZ - minZ;

  const main = neon(spec.color, 2.1);
  const second = neon(spec.color2, 1.8);
  const tube = neon("#cfd8ff", 0.85);

  // Пол (с проёмом под лестницу, если есть) и потолок.
  // Пол строится в плоскости XY и кладётся поворотом −π/2 вокруг X: (x, y) → (x, 0, −y).
  const floorShape = new THREE.Shape();
  floorShape.moveTo(minX, -maxZ);
  floorShape.lineTo(maxX, -maxZ);
  floorShape.lineTo(maxX, -minZ);
  floorShape.lineTo(minX, -minZ);
  floorShape.closePath();
  const hole = spec.floorHole;
  if (hole) {
    const path = new THREE.Path();
    path.moveTo(hole.minX, -hole.maxZ);
    path.lineTo(hole.maxX, -hole.maxZ);
    path.lineTo(hole.maxX, -hole.minZ);
    path.lineTo(hole.minX, -hole.minZ);
    path.closePath();
    floorShape.holes.push(path);
  }
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(floorShape), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), materials.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(cx, h, cz);
  g.add(ceiling);

  // Сетка на полу — линии обходят проём
  const cell = 1.2;
  const pts: number[] = [];
  const segment = (x1: number, z1: number, x2: number, z2: number) => pts.push(x1, 0.004, z1, x2, 0.004, z2);
  for (let x = minX + cell; x < maxX - 0.01; x += cell) {
    if (hole && x > hole.minX && x < hole.maxX) {
      if (hole.minZ > minZ) segment(x, minZ, x, hole.minZ);
      if (hole.maxZ < maxZ) segment(x, hole.maxZ, x, maxZ);
    } else segment(x, minZ, x, maxZ);
  }
  for (let z = minZ + cell; z < maxZ - 0.01; z += cell) {
    if (hole && z > hole.minZ && z < hole.maxZ) {
      if (hole.minX > minX) segment(minX, z, hole.minX, z);
      if (hole.maxX < maxX) segment(hole.maxX, z, maxX, z);
    } else segment(minX, z, maxX, z);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const gridMat = new THREE.LineBasicMaterial({ color: spec.color, transparent: true, opacity: 0.09, toneMapped: false });
  g.add(new THREE.LineSegments(gridGeometry, gridMat));

  // Стены
  const walls: Record<WallSide, { uMin: number; uMax: number; toU: (c: number) => number; place: (m: THREE.Object3D) => void }> = {
    zMin: { uMin: minX, uMax: maxX, toU: (x) => x, place: (m) => (m.position.z = minZ) },
    zMax: { uMin: minX, uMax: maxX, toU: (x) => x, place: (m) => (m.position.z = maxZ) },
    // Поворот на π/2 вокруг Y: локальный x → мировой −z, поэтому u = −z.
    xMin: { uMin: -maxZ, uMax: -minZ, toU: (z) => -z, place: (m) => ((m.rotation.y = Math.PI / 2), (m.position.x = minX)) },
    xMax: { uMin: -maxZ, uMax: -minZ, toU: (z) => -z, place: (m) => ((m.rotation.y = Math.PI / 2), (m.position.x = maxX)) },
  };

  for (const side of Object.keys(walls) as WallSide[]) {
    const wall = walls[side];
    const openings: Opening[] = (spec.openings?.[side] ?? []).map((o) => ({ u: wall.toU(o.center), width: o.width, height: o.height, bottom: o.bottom }));
    const mesh = new THREE.Mesh(wallGeometry(wall.uMin, wall.uMax, h, openings), materials.wall);
    wall.place(mesh);
    g.add(mesh);

    // Всё остальное строим в локальной системе стены и ставим так же.
    const local = new THREE.Group();
    wall.place(local);
    // Смещение внутрь комнаты (локальный +z стены = мировой +z или +x), чтобы детали не утонули в стене.
    const dz = side === "zMin" || side === "xMin" ? 1 : -1;
    const off = 0.03 * dz;

    // Плинтус (с разрывами под проёмы) и карниз
    let cursor = wall.uMin;
    const gaps = [...openings].sort((a, b) => a.u - b.u);
    for (const gap of gaps) {
      local.add(strip(main, [cursor, 0.06, off], [gap.u - gap.width / 2 - 0.3, 0.06, off], 0.04));
      cursor = gap.u + gap.width / 2 + 0.3;
    }
    local.add(strip(main, [cursor, 0.06, off], [wall.uMax, 0.06, off], 0.04));
    local.add(strip(second, [wall.uMin, h - 0.08, off], [wall.uMax, h - 0.08, off], 0.035));

    // Декоративные панели
    if (!spec.plainWalls?.includes(side)) {
      const span = wall.uMax - wall.uMin;
      const count = Math.floor(span / 1.6);
      for (let i = 0; i < count; i++) {
        const u = wall.uMin + (i + 0.5) * (span / count);
        const blocked = gaps.some((o) => Math.abs(u - o.u) < o.width / 2 + 0.9);
        if (blocked) continue;
        const panelH = h * 0.58;
        local.add(box(materials.panel, [1.1, panelH, 0.06], [u, h * 0.47, off * 1.5]));
        if (i % 3 === 1) {
          local.add(strip(second, [u - 0.42, h * 0.47 - panelH * 0.38, off * 3], [u - 0.42, h * 0.47 + panelH * 0.38, off * 3], 0.022));
        }
      }
    }
    g.add(local);
  }

  // Угловые вертикальные полосы
  for (const [x, z] of [
    [minX, minZ],
    [minX, maxZ],
    [maxX, minZ],
    [maxX, maxZ],
  ]) {
    const ix = x === minX ? 0.05 : -0.05;
    const iz = z === minZ ? 0.05 : -0.05;
    g.add(strip(main, [x + ix, 0, z + iz], [x + ix, h, z + iz], 0.04));
  }

  // Световые балки на потолке
  const alongX = spec.barsAlong ? spec.barsAlong === "x" : w >= d;
  const barCount = 2;
  for (let i = 0; i < barCount; i++) {
    const t = (i + 1) / (barCount + 1);
    if (alongX) {
      const z = minZ + d * t;
      g.add(strip(tube, [minX + 1.2, h - 0.05, z], [maxX - 1.2, h - 0.05, z], 0.04));
    } else {
      const x = minX + w * t;
      g.add(strip(tube, [x, h - 0.05, minZ + 1.2], [x, h - 0.05, maxZ - 1.2], 0.04));
    }
  }

  // Свет: комнаты тёмные, свет только подкрашивает стены.
  // Дальность ограничена размерами комнаты — теней нет, иначе свет «пробивает» стены в соседние комнаты.
  const key = new THREE.PointLight(spec.color, 6, Math.min(w, d) * 0.75, 2);
  key.position.set(cx, h - 0.6, cz);
  g.add(key);
  const fillA = new THREE.PointLight(spec.color2, 4, 5.5, 2);
  fillA.position.set(minX + 1.2, 1.2, minZ + 1.2);
  g.add(fillA);
  const fillB = new THREE.PointLight(spec.color2, 4, 5.5, 2);
  fillB.position.set(maxX - 1.2, 1.2, maxZ - 1.2);
  g.add(fillB);

  return g;
}
