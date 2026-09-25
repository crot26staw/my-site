"use client";

import { useEffect, useRef, useState } from "react";
import { onFrame, trackProgress } from "@/lib/scroll";
import { setViewMode, useViewMode } from "@/lib/viewMode";

/**
 * Фиксированный фон с 3D-сценой. Three.js грузится отдельным чанком после
 * первой отрисовки, чтобы не мешать LCP. В обычном режиме сцены нет — только CSS-фон;
 * без WebGL страница переключается в обычный режим (не запоминая выбор).
 */
export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const mode = useViewMode();

  useEffect(() => {
    if (mode !== "3d") return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      const [{ World }] = await Promise.all([import("@/scene/world"), document.fonts.ready]);
      if (disposed || !canvasRef.current) return;
      let world: InstanceType<typeof World>;
      try {
        world = new World(canvasRef.current);
      } catch (error) {
        console.warn("WebGL недоступен, включён обычный режим", error);
        setViewMode("flat", { persist: false });
        return;
      }
      let first = true;
      const unsubscribe = onFrame((time) => {
        world.frame(time, trackProgress);
        if (first) {
          first = false;
          setReady(true);
        }
      });
      cleanup = () => {
        unsubscribe();
        world.dispose();
        setReady(false);
      };
    };

    if (typeof requestIdleCallback === "function") requestIdleCallback(() => void start(), { timeout: 1200 });
    else setTimeout(() => void start(), 200);

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [mode]);

  return (
    <div className="scene" data-ready={ready || undefined} aria-hidden="true">
      {/* Новый canvas на каждое включение 3D: контекст WebGL освобождённой сцены не переиспользуем */}
      {mode === "3d" && <canvas ref={canvasRef} className="scene__canvas" />}
    </div>
  );
}
