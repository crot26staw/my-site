"use client";

import { useEffect, useRef, useState } from "react";
import { onFrame, trackProgress } from "@/lib/scroll";

/**
 * Фиксированный фон с 3D-сценой. Three.js грузится отдельным чанком после
 * первой отрисовки, чтобы не мешать LCP. Без WebGL остаётся CSS-фон.
 */
export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = async () => {
      const [{ World }] = await Promise.all([import("@/scene/world"), document.fonts.ready]);
      if (disposed || !canvasRef.current) return;
      let world: InstanceType<typeof World>;
      try {
        world = new World(canvasRef.current);
      } catch (error) {
        console.warn("WebGL недоступен, используется статичный фон", error);
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
      };
    };

    if (typeof requestIdleCallback === "function") requestIdleCallback(() => void start(), { timeout: 1200 });
    else setTimeout(() => void start(), 200);

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className="scene" data-ready={ready || undefined} aria-hidden="true">
      <canvas ref={canvasRef} className="scene__canvas" />
    </div>
  );
}
