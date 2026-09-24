import * as THREE from "three";
import { box, materials, neon, neonText, strip } from "./kit";

export interface DoorOptions {
  width: number;
  height: number;
  /** Толщина стены, в которую уезжают створки. */
  depth: number;
  color: string;
  color2: string;
  label?: string;
}

export interface Door {
  group: THREE.Group;
  /** 0 — закрыта, 1 — открыта. */
  setOpen(t: number): void;
  update(time: number): void;
}

/**
 * Двухстворчатая раздвижная дверь. Локально: проём по центру x=0, низ y=0, лицевая сторона смотрит в +z.
 * Створки уезжают внутрь стены.
 */
export function createDoor(o: DoorOptions): Door {
  const group = new THREE.Group();
  const leafW = o.width / 2;
  const leafDepth = Math.min(0.14, o.depth * 0.4);
  const accent = neon(o.color, 2.2);
  const accent2 = neon(o.color2, 1.8);
  const dim = neon(o.color2, 0.8);

  const makeLeaf = (side: -1 | 1) => {
    const leaf = new THREE.Group();
    leaf.add(box(materials.metal, [leafW, o.height, leafDepth], [0, o.height / 2, 0]));

    // Детали на обеих сторонах створки.
    for (const face of [1, -1]) {
      const z = face * (leafDepth / 2 + 0.006);
      const inner = -side * (leafW / 2); // кромка у шва
      // Утопленная панель
      leaf.add(box(materials.panel, [leafW * 0.72, o.height * 0.62, 0.012], [side * 0.02, o.height * 0.52, z]));
      // Неоновый шов у кромки
      leaf.add(strip(accent, [inner + side * 0.05, 0.12, z], [inner + side * 0.05, o.height - 0.12, z], 0.03));
      // Горизонтальные линии
      for (const y of [0.18, 0.86]) {
        leaf.add(strip(dim, [-leafW / 2 + 0.12, o.height * y, z], [leafW / 2 - 0.12, o.height * y, z], 0.018));
      }
      // Шевроны внизу
      for (let i = 0; i < 3; i++) {
        const chevron = box(accent2, [0.28, 0.035, 0.01], [side * 0.05, 0.32 + i * 0.13, z]);
        chevron.rotation.z = side * 0.6;
        leaf.add(chevron);
      }
      // Половина кольца «замка»
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 8, 48, Math.PI), accent);
      ring.position.set(inner, o.height * 0.52, z);
      ring.rotation.z = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      leaf.add(ring);
    }
    group.add(leaf);
    return leaf;
  };

  const left = makeLeaf(-1);
  const right = makeLeaf(1);

  // Откосы проёма и неоновая рамка на обеих сторонах стены.
  const jamb = 0.16;
  group.add(box(materials.metalDark, [jamb, o.height + jamb, o.depth + 0.12], [-o.width / 2 - jamb / 2, (o.height + jamb) / 2, 0]));
  group.add(box(materials.metalDark, [jamb, o.height + jamb, o.depth + 0.12], [o.width / 2 + jamb / 2, (o.height + jamb) / 2, 0]));
  group.add(box(materials.metalDark, [o.width + jamb * 2, jamb, o.depth + 0.12], [0, o.height + jamb / 2, 0]));
  for (const face of [1, -1]) {
    const z = face * (o.depth / 2 + 0.07);
    const x = o.width / 2 + jamb + 0.03;
    const top = o.height + jamb + 0.03;
    group.add(strip(accent, [-x, 0, z], [-x, top, z], 0.045));
    group.add(strip(accent, [x, 0, z], [x, top, z], 0.045));
    group.add(strip(accent, [-x, top, z], [x, top, z], 0.045));
    // Порог
    group.add(strip(accent2, [-o.width / 2, 0.012, z * 0.6], [o.width / 2, 0.012, z * 0.6], 0.03));
  }

  // Сигнальная лампа и табличка над дверью (только с лицевой стороны).
  const lamp = box(neon(o.color, 4).clone(), [0.5, 0.06, 0.04], [0, o.height + jamb + 0.2, o.depth / 2 + 0.08]);
  group.add(lamp);
  if (o.label) {
    const sign = neonText(o.label, { color: o.color2, height: 0.22, intensity: 1.05 });
    sign.position.set(0, o.height + jamb + 0.5, o.depth / 2 + 0.14);
    group.add(sign);
  }

  let open = 0;
  const lampMat = lamp.material as THREE.MeshBasicMaterial;
  const lampBase = lampMat.color.clone();

  return {
    group,
    setOpen(t) {
      open = t;
      const shift = t * (leafW + 0.04);
      left.position.x = -leafW / 2 - shift;
      right.position.x = leafW / 2 + shift;
    },
    update(time) {
      // Лампа мигает, пока дверь закрыта.
      const blink = open > 0.01 ? 1 : 0.55 + 0.45 * Math.sin(time * 0.004) ** 2;
      lampMat.color.copy(lampBase).multiplyScalar(blink);
    },
  };
}
