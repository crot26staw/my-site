"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { QUIZ_PLAN_EVENT } from "@/config/quiz";
import { TRACKS } from "@/scene/path";
import { emitFrame, measureTrack, onScrollLock, prefersReducedMotion, trackProgress } from "@/lib/scroll";

/**
 * Плавный скролл (Lenis), прогресс участков data-track, якоря и появление [data-reveal].
 * Один requestAnimationFrame на всю страницу: сцена подписывается через onFrame().
 */
export function ScrollDirector() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const lenis = reduced ? null : new Lenis({ autoRaf: false, lerp: 0.09, wheelMultiplier: 0.9 });

    const offScrollLock = onScrollLock((locked) => (locked ? lenis?.stop() : lenis?.start()));

    let tracks = Array.from(document.querySelectorAll<HTMLElement>("[data-track]"));
    if (process.env.NODE_ENV !== "production") {
      const inDom = tracks.map((el) => el.dataset.track);
      if (inDom.join() !== TRACKS.join()) console.warn("Разметка страницы и маршрут камеры расходятся", { inDom, route: TRACKS });
    }
    const lastValues = new Map<HTMLElement, number>();

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
      updateTracks();
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
      if (link.dataset.plan) window.dispatchEvent(new CustomEvent(QUIZ_PLAN_EVENT, { detail: link.dataset.plan }));
      if (target !== document.body) target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    // Появление блоков при прокрутке.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    // Плавающая кнопка Telegram не должна перекрывать кнопки форм на мобильных.
    const formsOnScreen = new Set<Element>();
    const fabIo = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) formsOnScreen.add(entry.target);
        else formsOnScreen.delete(entry.target);
      }
      document.documentElement.classList.toggle("fab-hidden", formsOnScreen.size > 0);
    });
    document.querySelectorAll("[data-hide-fab]").forEach((el) => fabIo.observe(el));

    return () => {
      cancelAnimationFrame(rafId);
      offScrollLock();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onClick);
      io.disconnect();
      fabIo.disconnect();
      lenis?.destroy();
    };
  }, []);

  return null;
}
