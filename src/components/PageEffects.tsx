"use client";

import { useEffect } from "react";
import { initPress } from "@/lib/press";
import { initReveal } from "@/lib/reveal";
import { prefersReducedMotion } from "@/lib/scroll";

/** Эффекты отдельных страниц (без 3D-сцены и ScrollDirector): появление блоков и продавливание карточек. */
export function PageEffects() {
  useEffect(() => {
    const offReveal = initReveal();
    const offPress = prefersReducedMotion() ? undefined : initPress();
    return () => {
      offReveal();
      offPress?.();
    };
  }, []);

  return null;
}
