import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { rooms } from "@/config/rooms";
import { createDoor, type Door } from "./door";
import { neon, neonText, strip } from "./kit";
import { buildRoom, type RoomSpec, type WallSide } from "./room";
import { evaluate, type Layout } from "./path";
import { DOORS, ROOMS, WALL, dirOf, roomById, type Bounds, type RouteRoom } from "./route";

const DOOR = { width: 3, height: 3.4 };

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
  private isMobile = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    for (const r of ROOMS) {
      const colors = rooms[r.colors];
      const group = new THREE.Group();

      // Проёмы — там, где в стенах этой комнаты стоят двери.
      const openings: RoomSpec["openings"] = {};
      for (const d of DOORS) {
        if (d.from !== r.id && d.to !== r.id) continue;
        const { side, along } = wallAt(r.bounds, d.x, d.z);
        (openings[side] ??= []).push({ center: along, ...opening });
      }
      const contentWall = r.contentYaw === undefined ? undefined : wallInDirection(r, r.contentYaw);

      group.add(
        buildRoom({
          ...r.bounds,
          height: r.height,
          color: colors.neon,
          color2: colors.neon2,
          barsAlong: r.barsAlong,
          openings,
          plainWalls: contentWall ? [contentWall.side] : [],
        }),
      );

      // Надпись на стене напротив входа; если там дверь (первая комната) — над ней.
      const entry = DOORS.find((d) => d.to === r.id && d.id !== "exit");
      if (r.sign && entry) {
        const wall = wallInDirection(r, entry.yaw);
        const d = dirOf(entry.yaw);
        const hasDoor = DOORS.some((door) => (door.from === r.id || door.to === r.id) && door !== entry && wallAt(r.bounds, door.x, door.z).side === wall.side);
        const dist = wall.distance - 0.14;
        this.sign(r.sign, colors.neon, [r.stand.x + d.x * dist, hasDoor ? 4.16 : 3.55, r.stand.z + d.z * dist], entry.yaw, group, hasDoor ? 0.3 : undefined);
      }

      if (contentWall && r.contentYaw !== undefined) {
        const d = dirOf(r.contentYaw);
        const onX = Math.abs(d.x) > 0.5;
        const plane = (onX ? r.stand.x + d.x * contentWall.distance : r.stand.z + d.z * contentWall.distance) - (onX ? d.x : d.z) * 0.05;
        this.screenFrame(onX ? "x" : "z", plane, onX ? r.stand.z : r.stand.x, colors.neon, colors.neon2, group);
      }

      group.add(this.buildDust(r.bounds, r.height));
      this.scene.add(group);
      this.roomGroups.set(r.id, group);
    }

    this.sign("ВЕБ-СТУДИЯ", rooms.hero.neon2, [5 - 0.14, 2.9, 4.2], -Math.PI / 2, this.roomGroups.get("vestibule")!);

    // Двери: цвет двери = цвет комнаты, в которую она ведёт.
    for (const d of DOORS) {
      const colors = rooms[d.id === "hero" ? "hero" : roomById[d.to].colors];
      const door = createDoor({ ...DOOR, depth: WALL, color: colors.neon, color2: colors.neon2, label: d.label });
      door.group.position.set(d.x, 0, d.z);
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
    const state = evaluate(tracks, this.layout, this.reduced);

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
