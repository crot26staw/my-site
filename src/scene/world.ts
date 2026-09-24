import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { rooms } from "@/config/rooms";
import { createDoor, type Door } from "./door";
import { box, materials, neon, neonText, strip } from "./kit";
import { buildRoom, type RoomSpec, type WallSide } from "./room";
import { createRoute, type Layout } from "./path";
import { MOBILE_QUERY, RAMP, RISE, STAIRS, WALL, buildPlan, dirOf, type Bounds, type RouteDoor, type RouteRoom } from "./route";

const DOOR = { width: 3, height: 3.4 };

/**
 * Лестница вверх у стены с дверью: площадка на высоте rise, ступени спускаются к полу.
 * face — точка на внутренней поверхности стены напротив двери, inward — единичный вектор внутрь комнаты.
 */
function buildStairs(face: { x: number; z: number }, inward: { x: number; z: number }, rise: number, color: string) {
  const g = new THREE.Group();
  const edge = neon(color, 2.4);
  const alongX = Math.abs(inward.x) > 0.5;
  const w = STAIRS.width;
  const at = wallFrame(face, inward);
  const size = (depth: number, h: number): [number, number, number] => (alongX ? [depth, h, w] : [w, h, depth]);

  const stepH = rise / STAIRS.steps;
  let start = 0;
  for (let k = 0; k < STAIRS.steps; k++) {
    const depth = k === 0 ? STAIRS.landing : STAIRS.run;
    const h = rise - k * stepH;
    g.add(box(materials.metalDark, size(depth, h), at(start + depth / 2, 0, h / 2)));
    g.add(strip(edge, at(start + depth - 0.02, -w / 2 + 0.05, h + 0.012), at(start + depth - 0.02, w / 2 - 0.05, h + 0.012), 0.035));
    start += depth;
  }
  return g;
}

/** Координаты относительно стены: dist — вглубь комнаты, lateral — вдоль стены, y — высота. */
function wallFrame(face: { x: number; z: number }, inward: { x: number; z: number }) {
  const alongX = Math.abs(inward.x) > 0.5;
  return (dist: number, lateral: number, y: number): THREE.Vector3Tuple => [
    face.x + inward.x * dist + (alongX ? 0 : lateral),
    y,
    face.z + inward.z * dist + (alongX ? lateral : 0),
  ];
}

/** Плоский четырёхугольник по четырём точкам (по кругу). */
function quad(material: THREE.Material, a: THREE.Vector3Tuple, b: THREE.Vector3Tuple, c: THREE.Vector3Tuple, d: THREE.Vector3Tuple) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

/**
 * Пандус в подвал: от верха (RAMP.length от стены, уровень пола) вниз на rise к площадке у двери.
 * Боковые стенки, неоновые кромки по краям пандуса и проёма.
 */
function buildRamp(face: { x: number; z: number }, inward: { x: number; z: number }, rise: number, color: string) {
  const g = new THREE.Group();
  const edge = neon(color, 2.4);
  const at = wallFrame(face, inward);
  const w = RAMP.width / 2;
  const { length: L, landing: Lb } = RAMP;
  const surface = new THREE.MeshStandardMaterial({ color: 0x0b0d14, roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide });
  const side = new THREE.MeshStandardMaterial({ color: 0x0f121b, roughness: 0.86, metalness: 0.18, side: THREE.DoubleSide });

  // Площадка у двери и наклонная плоскость
  g.add(quad(surface, at(0, -w, -rise), at(0, w, -rise), at(Lb, w, -rise), at(Lb, -w, -rise)));
  g.add(quad(surface, at(Lb, -w, -rise), at(Lb, w, -rise), at(L, w, 0), at(L, -w, 0)));

  for (const s of [-1, 1]) {
    // Боковая стенка: от кромки пола вниз до пандуса
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([...at(0, s * w, 0), ...at(0, s * w, -rise), ...at(Lb, s * w, -rise), ...at(0, s * w, 0), ...at(Lb, s * w, -rise), ...at(L, s * w, 0)], 3),
    );
    geometry.computeVertexNormals();
    g.add(new THREE.Mesh(geometry, side));

    // Неоновая кромка вдоль пандуса (по уклону) и вдоль края проёма
    const low = at(Lb, s * (w - 0.08), -rise + 0.02);
    const high = at(L, s * (w - 0.08), 0.02);
    const dir = new THREE.Vector3(high[0] - low[0], high[1] - low[1], high[2] - low[2]);
    const tube = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, dir.length()), edge);
    tube.position.set((low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2);
    tube.lookAt(high[0], high[1], high[2]);
    g.add(tube);
    g.add(strip(edge, at(0, s * (w - 0.08), -rise + 0.02), at(Lb, s * (w - 0.08), -rise + 0.02), 0.04));
    g.add(strip(edge, at(0, s * w, 0.012), at(L, s * w, 0.012), 0.035));
  }
  g.add(strip(edge, at(L, -w, 0.012), at(L, w, 0.012), 0.035));

  // Стена ниже пола по бокам от двери (между откосом и стенкой пандуса)
  const gap = w - (DOOR.width / 2 + 0.16);
  for (const s of [-1, 1]) {
    const alongX = Math.abs(inward.x) > 0.5;
    const size: [number, number, number] = alongX ? [WALL, rise, gap] : [gap, rise, WALL];
    g.add(box(materials.wall, size, at(-WALL / 2, s * (w - gap / 2), -rise / 2)));
  }
  return g;
}

/** Прямоугольник, который пандус в подвал вырезает в полу. */
function stairsFootprint(door: RouteDoor) {
  const d = dirOf(door.yaw);
  const face = { x: door.x - d.x * (WALL / 2), z: door.z - d.z * (WALL / 2) };
  const far = { x: face.x - d.x * RAMP.length, z: face.z - d.z * RAMP.length };
  const half = RAMP.width / 2;
  const alongX = Math.abs(d.x) > 0.5;
  return {
    minX: alongX ? Math.min(face.x, far.x) : face.x - half,
    maxX: alongX ? Math.max(face.x, far.x) : face.x + half,
    minZ: alongX ? face.z - half : Math.min(face.z, far.z),
    maxZ: alongX ? face.z + half : Math.max(face.z, far.z),
  };
}

/** На какой стене комнаты стоит точка (дверь чуть за стеной) и её координата вдоль стены. */
function wallAt(b: Bounds, x: number, z: number): { side: WallSide; along: number } {
  const near = (a: number, c: number) => Math.abs(a - c) < 0.5;
  if (near(x, b.minX)) return { side: "xMin", along: z };
  if (near(x, b.maxX)) return { side: "xMax", along: z };
  if (near(z, b.minZ)) return { side: "zMin", along: x };
  if (near(z, b.maxZ)) return { side: "zMax", along: x };
  throw new Error(`Точка (${x}, ${z}) не на стене комнаты`);
}

/** Стена, на которую смотрит камера из точки stand, и расстояние до неё. */
function wallInDirection(r: RouteRoom, yaw: number): { side: WallSide; distance: number } {
  const d = dirOf(yaw);
  const b = r.bounds;
  if (d.x < -0.5) return { side: "xMin", distance: r.stand.x - b.minX };
  if (d.x > 0.5) return { side: "xMax", distance: b.maxX - r.stand.x };
  if (d.z < -0.5) return { side: "zMin", distance: r.stand.z - b.minZ };
  return { side: "zMax", distance: b.maxZ - r.stand.z };
}

export class World {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.05, 60);
  private roomGroups = new Map<string, THREE.Group>();
  private doors = new Map<string, { door: Door; rooms: string[] }>();
  private dust: THREE.Points[] = [];
  private dustMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(0.8, 0.9, 1.2),
    size: 0.025,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  private layout: Layout = { heroOffsetX: 0, heroDistance: 8, heroShiftY: 0 };
  private size = { w: 1, h: 1 };
  private pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  private isMobile = window.matchMedia(MOBILE_QUERY).matches;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** План выбирается один раз при загрузке: на мобильных — прямой коридор. */
  private plan = buildPlan(this.isMobile);
  private route = createRoute(this.plan);

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new THREE.Color(0x04050a);
    this.scene.fog = new THREE.FogExp2(0x04050a, 0.03);
    this.scene.add(new THREE.AmbientLight(0x6070a0, 0.14));
    this.camera.rotation.order = "YXZ";

    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: this.isMobile ? 0 : 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.32, 1);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.buildWorld();

    this.resize();
    window.addEventListener("resize", this.resize);
    if (!this.isMobile && !this.reduced) window.addEventListener("pointermove", this.onPointer);
  }

  private buildWorld() {
    const opening = { width: DOOR.width, height: DOOR.height };
    const { rooms: planRooms, doors: planDoors, roomById, doorAfter } = this.plan;

    for (const r of planRooms) {
      const colors = rooms[r.colors];
      const group = new THREE.Group();

      // Проёмы — там, где в стенах этой комнаты стоят двери.
      const openings: RoomSpec["openings"] = {};
      for (const d of planDoors) {
        if (d.from !== r.id && d.to !== r.id) continue;
        const { side, along } = wallAt(r.bounds, d.x, d.z);
        const bottom = d.y - r.level;
        // Дверь в подвале: низ проёма ниже пола — в стене комнаты вырезаем только часть над полом.
        (openings[side] ??= []).push(
          bottom < 0 ? { center: along, width: opening.width, height: opening.height + bottom } : { center: along, ...opening, bottom },
        );
      }
      const contentWall = r.contentYaw === undefined ? undefined : wallInDirection(r, r.contentYaw);
      const freeContentWall = contentWall && !openings[contentWall.side] ? contentWall : undefined;

      group.add(
        buildRoom({
          ...r.bounds,
          height: r.height,
          color: colors.neon,
          color2: colors.neon2,
          barsAlong: r.barsAlong,
          openings,
          plainWalls: freeContentWall ? [freeContentWall.side] : [],
          floorHole: r.stairs === "down" ? stairsFootprint(doorAfter(r.id)) : undefined,
        }),
      );

      // Стена с контентом без двери (дверь сбоку): неоновая рамка-экран и надпись над ней.
      // Если в этой стене дверь дальше — её подсветка и табличка работают вместо рамки.
      if (freeContentWall && r.contentYaw !== undefined) {
        const d = dirOf(r.contentYaw);
        const onX = Math.abs(d.x) > 0.5;
        const plane = (onX ? r.stand.x + d.x * freeContentWall.distance : r.stand.z + d.z * freeContentWall.distance) - (onX ? d.x : d.z) * 0.05;
        this.screenFrame(onX ? "x" : "z", plane, onX ? r.stand.z : r.stand.x, colors.neon, colors.neon2, group);
        if (r.sign) {
          const dist = freeContentWall.distance - 0.14;
          this.sign(r.sign, colors.neon, [r.stand.x + d.x * dist, 4.32, r.stand.z + d.z * dist], r.contentYaw, group, 0.34);
        }
      }

      // У дальней стены: лестница вверх или пандус в подвал.
      if (r.stairs) {
        const door = doorAfter(r.id);
        const d = dirOf(door.yaw);
        const face = { x: door.x - d.x * (WALL / 2), z: door.z - d.z * (WALL / 2) };
        const inward = { x: -d.x, z: -d.z };
        group.add(r.stairs === "up" ? buildStairs(face, inward, RISE, colors.neon) : buildRamp(face, inward, RISE, colors.neon));
      }
      group.position.y = r.level;

      group.add(this.buildDust(r.bounds, r.height));
      this.scene.add(group);
      this.roomGroups.set(r.id, group);
    }

    const vestibule = roomById.vestibule.bounds;
    this.sign("ВЕБ-СТУДИЯ", rooms.hero.neon2, [vestibule.maxX - 0.14, 2.9, 4.2], -Math.PI / 2, this.roomGroups.get("vestibule")!);

    // Двери: цвет двери = цвет комнаты, в которую она ведёт.
    for (const d of planDoors) {
      const colors = rooms[d.id === "hero" ? "hero" : roomById[d.to].colors];
      const door = createDoor({ ...DOOR, depth: WALL, color: colors.neon, color2: colors.neon2, label: d.label, labelBack: d.labelBack });
      door.group.position.set(d.x, d.y, d.z);
      door.group.rotation.y = d.yaw; // лицевая сторона смотрит в комнату, из которой подходим
      door.setOpen(0);
      this.scene.add(door.group);
      this.doors.set(d.id, { door, rooms: [d.from, d.to] });
    }
  }

  /** Неоновая надпись на стене. rotationY: 0 — лицом в +z, π/2 — в +x, −π/2 — в −x. */
  private sign(text: string, color: string, position: THREE.Vector3Tuple, rotationY: number, parent: THREE.Object3D, height?: number) {
    const mesh = neonText(text, { color, height: height ?? (text.length > 16 ? 0.4 : 0.5) });
    mesh.position.set(...position);
    mesh.rotation.y = rotationY;
    parent.add(mesh);
  }

  /**
   * Неоновая рамка-экран на стене, за HTML-контентом комнаты.
   * axis — ось, перпендикулярная стене; plane — координата стены; center — центр рамки вдоль стены.
   */
  private screenFrame(axis: "x" | "z", plane: number, center: number, color: string, color2: string, parent: THREE.Object3D) {
    const mat = neon(color, 2.1);
    const at = (along: number, y: number): THREE.Vector3Tuple => (axis === "x" ? [plane, y, along] : [along, y, plane]);
    const [a0, a1, y0, y1] = [center - 4.6, center + 4.6, 0.55, 4.0];
    parent.add(
      strip(mat, at(a0, y0), at(a1, y0), 0.04),
      strip(mat, at(a0, y1), at(a1, y1), 0.04),
      strip(mat, at(a0, y0), at(a0, y1), 0.04),
      strip(mat, at(a1, y0), at(a1, y1), 0.04),
      strip(neon(color2, 2.4), at(a0 + 0.6, y1 + 0.18), at(a0 + 3, y1 + 0.18), 0.03),
    );
  }

  /** Пылинки в воздухе комнаты — дают глубину и ощущение пространства. */
  private buildDust(b: Bounds, height: number) {
    const count = this.isMobile ? 70 : 150;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = THREE.MathUtils.randFloat(b.minX, b.maxX);
      positions[i * 3 + 1] = THREE.MathUtils.randFloat(0, height);
      positions[i * 3 + 2] = THREE.MathUtils.randFloat(b.minZ, b.maxZ);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, this.dustMaterial);
    this.dust.push(points);
    return points;
  }

  private onPointer = (event: PointerEvent) => {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };

  resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.8 ? 66 : aspect < 1.2 ? 58 : 50;
    this.camera.updateProjectionMatrix();
    // На широких экранах дверь справа от текста, на узких — по центру.
    this.layout = {
      heroOffsetX: aspect > 1.15 ? -Math.min(2.6, 1.6 * aspect - 0.2) : 0,
      heroDistance: aspect < 0.8 ? 9.5 : 8.2,
      heroShiftY: aspect < 1.15 ? 0.2 : 0,
    };
    this.size = { w, h };
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const bloomScale = this.isMobile ? 0.35 : 0.5;
    this.bloom.resolution.set(w * bloomScale, h * bloomScale);
  };

  frame(time: number, tracks: Record<string, number>) {
    const state = this.route(tracks, this.layout, this.reduced);

    this.pointer.sx += (this.pointer.x - this.pointer.sx) * 0.05;
    this.pointer.sy += (this.pointer.y - this.pointer.sy) * 0.05;

    const { pose } = state;
    this.camera.position.set(pose.x, pose.y, pose.z);
    this.camera.rotation.set(pose.pitch - this.pointer.sy * 0.025, pose.yaw - this.pointer.sx * 0.04, 0);
    const shift = this.layout.heroShiftY * state.intro;
    if (shift > 0.001) {
      const { w, h } = this.size;
      this.camera.setViewOffset(w, h, 0, shift * h, w, h);
    } else if (this.camera.view?.enabled) {
      this.camera.clearViewOffset();
    }

    // Рисуем только три соседние комнаты и их двери.
    for (const [id, group] of this.roomGroups) group.visible = state.visible.includes(id);
    for (const [id, { door, rooms: pair }] of this.doors) {
      door.group.visible = pair.some((r) => state.visible.includes(r));
      if (!door.group.visible) continue;
      door.setOpen(state.doors[id] ?? 0);
      door.update(time);
    }

    if (!this.reduced) {
      const drift = Math.sin(time * 0.00025) * 0.15;
      for (const points of this.dust) points.position.y = drift;
    }

    this.composer.render();
  }

  dispose() {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onPointer);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((m) => {
        (m as THREE.MeshBasicMaterial).map?.dispose();
        m.dispose();
      });
    });
    this.composer.dispose();
    this.renderer.dispose();
  }
}
