"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { rooms, type RoomId } from "@/config/rooms";
import { TRACKS } from "@/scene/path";
import { emitFrame, measureTrack, onFrame, onScrollLock, prefersReducedMotion, trackProgress } from "@/lib/scroll";
import { initPress } from "@/lib/press";
import { initReveal } from "@/lib/reveal";
import { getViewMode, onViewMode } from "@/lib/viewMode";

/**
 * Плавный скролл (Lenis), прогресс участков data-track, якоря и появление [data-reveal].
 * Один requestAnimationFrame на всю страницу: сцена подписывается через onFrame().
 * В обычном режиме (без 3D) скролл нативный, прогресс участков не считается.
 */
export function ScrollDirector() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    let lenis: Lenis | null = null;
    let flat = false;

    const offScrollLock = onScrollLock((locked) => (locked ? lenis?.stop() : lenis?.start()));

    let tracks = Array.from(document.querySelectorAll<HTMLElement>("[data-track]"));
    if (process.env.NODE_ENV !== "production") {
      const inDom = tracks.map((el) => el.dataset.track);
      if (inDom.join() !== TRACKS.join()) console.warn("Разметка страницы и маршрут камеры расходятся", { inDom, route: TRACKS });
    }
    const lastValues = new Map<HTMLElement, number>();

    const applyViewMode = () => {
      flat = getViewMode() === "flat";
      if (flat) {
        lenis?.destroy();
        lenis = null;
        // Сбрасываем то, что участки получили в 3D, — иначе интро первого экрана останется скрытым.
        for (const el of tracks) {
          el.style.removeProperty("--p");
          el.removeAttribute("data-faded");
        }
        lastValues.clear();
      } else if (!reduced && !lenis) {
        lenis = new Lenis({ autoRaf: false, lerp: 0.09, wheelMultiplier: 0.9 });
      }
    };
    applyViewMode();
    const offViewMode = onViewMode(applyViewMode);

    const updateTracks = () => {
      const vh = window.innerHeight;
      for (const el of tracks) {
        const p = measureTrack(el, vh);
        trackProgress[el.dataset.track!] = p;
        if (lastValues.get(el) !== p) {
          lastValues.set(el, p);
          el.style.setProperty("--p", p.toFixed(4));
          // Скрытый интро-контент не должен ловить клики и фокус.
          const fadeUntil = el.dataset.fadeUntil;
          if (fadeUntil) el.toggleAttribute("data-faded", p >= Number(fadeUntil));
        }
      }
    };

    let rafId = 0;
    const loop = (time: number) => {
      lenis?.raf(time);
      if (!flat) updateTracks();
      emitFrame(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const onResize = () => {
      tracks = Array.from(document.querySelectorAll<HTMLElement>("[data-track]"));
    };
    window.addEventListener("resize", onResize);

    // Якоря. Высоту sticky-шапки задаёт scroll-margin-top — его учитывают и Lenis, и нативный скролл.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const hash = link.getAttribute("href")!;
      const target = hash === "#" || hash === "#top" ? document.body : document.querySelector<HTMLElement>(hash);
      if (!target) return;
      event.preventDefault();
      if (lenis) {
        // Если страницу только что прокрутили в обход Lenis (скроллбар, клавиши), синхронизируем позицию.
        if (Math.abs(lenis.animatedScroll - window.scrollY) > 2) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        lenis.scrollTo(target === document.body ? 0 : target, { duration: 1.6 });
      } else {
        target.scrollIntoView();
      }
      history.pushState(null, "", hash === "#top" ? location.pathname : hash);
      if (target !== document.body) target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    const offReveal = initReveal();

    // Плавающие кнопки (Telegram, 3D) на мобильных прячутся, только когда под ними оказывается
    // кнопка формы из блока [data-hide-fab]. Кнопки квиза меняются по шагам, поэтому ищем их на каждой проверке.
    const FAB_ZONE_H = 150; // две плавающие кнопки с отступами + safe-area
    const FAB_ZONE_W = 80;
    const mobile = window.matchMedia("(max-width: 767px)");
    let fabHidden = false;
    const updateFab = () => {
      let covered = false;
      if (mobile.matches) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        for (const btn of document.querySelectorAll<HTMLElement>("[data-hide-fab] .btn")) {
          const r = btn.getBoundingClientRect();
          if (r.bottom > vh - FAB_ZONE_H && r.top < vh && r.right > vw - FAB_ZONE_W && r.width > 0) {
            covered = true;
            break;
          }
        }
      }
      if (covered !== fabHidden) {
        fabHidden = covered;
        document.documentElement.classList.toggle("fab-hidden", covered);
      }
    };
    const offFabFrame = onFrame(updateFab);

    // Свечение фона — под неон блока, который пересекает середину экрана.
    const scene = document.querySelector<HTMLElement>(".scene");
    const glowIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const room = rooms[(entry.target as HTMLElement).dataset.track as RoomId];
          if (!entry.isIntersecting || !room || !scene) continue;
          scene.style.setProperty("--glow", room.neon);
          scene.style.setProperty("--glow-2", room.neon2);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll("main > section[data-track]").forEach((el) => glowIo.observe(el));

    const offPress = reduced ? undefined : initPress();

    return () => {
      cancelAnimationFrame(rafId);
      offPress?.();
      offScrollLock();
      offViewMode();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onClick);
      offReveal();
      offFabFrame();
      // Уходим на другую страницу — плавающие кнопки там не должны остаться скрытыми.
      document.documentElement.classList.remove("fab-hidden");
      glowIo.disconnect();
      lenis?.destroy();
    };
  }, []);

  return null;
}
