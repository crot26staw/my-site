/**
 * Неоновые подсветки комнат. Общие для 3D-сцены и HTML-блоков,
 * чтобы акценты интерфейса совпадали со светом в комнате.
 */
export const rooms = {
  hero: { neon: "#ff2bd6", neon2: "#00e5ff" },
  why: { neon: "#b6ff2e", neon2: "#8b6bff" },
  forWhom: { neon: "#ff7a1a", neon2: "#00e5ff" },
  services: { neon: "#3d8bff", neon2: "#ff3b6b" },
  pricing: { neon: "#ffd23f", neon2: "#ff2bd6" },
  cases: { neon: "#00ffc6", neon2: "#ff7a1a" },
  process: { neon: "#c04bff", neon2: "#00e5ff" },
  quiz: { neon: "#ff2bd6", neon2: "#ffd23f" },
  team: { neon: "#00e5ff", neon2: "#ff3b6b" },
  guarantees: { neon: "#39ff88", neon2: "#3d8bff" },
  faq: { neon: "#ff9d00", neon2: "#8b6bff" },
  contact: { neon: "#ff2bd6", neon2: "#00e5ff" },
} as const;

export type RoomId = keyof typeof rooms;

/** CSS-переменные акцентов для секции. */
export function roomStyle(id: RoomId): React.CSSProperties {
  return { "--neon": rooms[id].neon, "--neon-2": rooms[id].neon2 } as React.CSSProperties;
}
