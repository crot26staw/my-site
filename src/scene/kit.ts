import * as THREE from "three";

/* ---------- Материалы ---------- */

const neonCache = new Map<string, THREE.MeshBasicMaterial>();

/** Светящийся материал: цвет выше 1.0 попадает в bloom. */
export function neon(hex: string, intensity = 3): THREE.MeshBasicMaterial {
  const key = `${hex}:${intensity}`;
  let mat = neonCache.get(key);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(hex).multiplyScalar(intensity),
      toneMapped: false,
    });
    neonCache.set(key, mat);
  }
  return mat;
}

export const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0x0f121b, roughness: 0.86, metalness: 0.18, side: THREE.DoubleSide }),
  panel: new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.6, metalness: 0.45 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x08090f, roughness: 0.5, metalness: 0.35 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0x090b11, roughness: 0.95, metalness: 0.1, side: THREE.DoubleSide }),
  metal: new THREE.MeshStandardMaterial({ color: 0x1a1f2c, roughness: 0.38, metalness: 0.85 }),
  metalDark: new THREE.MeshStandardMaterial({ color: 0x0c0f16, roughness: 0.5, metalness: 0.7 }),
};

/* ---------- Геометрия ---------- */

const unitBox = new THREE.BoxGeometry(1, 1, 1);

/** Прямоугольный брусок по центру и размерам. */
export function box(
  material: THREE.Material,
  size: [number, number, number],
  position: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(...size);
  mesh.position.set(...position);
  return mesh;
}

/** Неоновая полоса между двумя точками, отличающимися по одной оси. */
export function strip(material: THREE.Material, from: THREE.Vector3Tuple, to: THREE.Vector3Tuple, thickness = 0.035) {
  const size: [number, number, number] = [
    Math.max(Math.abs(to[0] - from[0]), thickness),
    Math.max(Math.abs(to[1] - from[1]), thickness),
    Math.max(Math.abs(to[2] - from[2]), thickness),
  ];
  const center: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  return box(material, size, center);
}

export interface Opening {
  /** Центр проёма вдоль стены (локальная координата u). */
  u: number;
  width: number;
  height: number;
}

/**
 * Стена в локальной плоскости XY (u вдоль стены, v вверх) с проёмами от пола.
 * Контур обходит проёмы, поэтому треугуляция всегда корректная.
 */
export function wallGeometry(uMin: number, uMax: number, height: number, openings: Opening[] = []) {
  const shape = new THREE.Shape();
  shape.moveTo(uMin, 0);
  for (const op of [...openings].sort((a, b) => a.u - b.u)) {
    shape.lineTo(op.u - op.width / 2, 0);
    shape.lineTo(op.u - op.width / 2, op.height);
    shape.lineTo(op.u + op.width / 2, op.height);
    shape.lineTo(op.u + op.width / 2, 0);
  }
  shape.lineTo(uMax, 0);
  shape.lineTo(uMax, height);
  shape.lineTo(uMin, height);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/* ---------- Неоновые надписи ---------- */

function displayFont(): string {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return family || "system-ui, sans-serif";
}

export interface NeonTextOptions {
  color: string;
  /** Высота строки в мировых единицах. */
  height: number;
  intensity?: number;
  weight?: number;
  letterSpacing?: number;
}

/** Плоскость с неоновым текстом (canvas-текстура). */
export function neonText(text: string, opts: NeonTextOptions): THREE.Mesh {
  const px = 128;
  const pad = px * 0.5;
  const font = `${opts.weight ?? 700} ${px}px ${displayFont()}`;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const spacing = (opts.letterSpacing ?? 0.08) * px;
  const textWidth = ctx.measureText(text).width + spacing * (text.length - 1);
  canvas.width = Math.ceil(textWidth + pad * 2);
  canvas.height = Math.ceil(px * 1.3 + pad * 2);

  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${spacing}px`;
  ctx.shadowColor = opts.color;
  ctx.fillStyle = opts.color;
  ctx.shadowBlur = px * 0.35;
  ctx.fillText(text, pad, canvas.height / 2);
  ctx.shadowBlur = px * 0.1;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.3;
  ctx.fillText(text, pad, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const worldH = opts.height * (canvas.height / (px * 1.3));
  const geometry = new THREE.PlaneGeometry(worldH * (canvas.width / canvas.height), worldH);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    color: new THREE.Color(1, 1, 1).multiplyScalar(opts.intensity ?? 1.2),
  });
  return new THREE.Mesh(geometry, material);
}
