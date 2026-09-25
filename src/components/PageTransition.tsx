"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { growKeyframes } from "@/lib/popFrom";
import { prefersReducedMotion } from "@/lib/scroll";

const DURATION_MS = 680;
/** Размер окна новой страницы на первом этапе — доля экрана. */
const SMALL = 0.3;
/** Если новая страница так и не отрисовалась, не держим переход дольше этого. */
const TIMEOUT_MS = 4000;

/**
 * Переход между страницами как у модалки: новая страница появляется маленьким окном в центре экрана
 * и вырастает до полного размера, старая за ней темнеет и размывается.
 *
 * View Transitions API снимает старую страницу, Next подменяет содержимое, затем снимок новой
 * анимируется поверх старого (стили ::view-transition-* в globals.css).
 * Работает для ссылок PageLink. Без поддержки API или при reduce motion — обычный переход Next.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<{ hash: string; resolve: () => void } | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-page-link]");
      if (!link || !document.startViewTransition || prefersReducedMotion()) return;
      // Кнопки модалок (заявка, квиз) ведут на страницу только без JS — с JS их открывает Modal.
      if (link.hasAttribute("data-lead") || link.hasAttribute("data-quiz")) return;
      // Ссылка на эту же страницу — пусть Next обработает как обычно.
      if (samePath(new URL(link.href).pathname, location.pathname)) return;
      // Capture — раньше обработчика Link: он видит defaultPrevented и сам не переходит.
      event.preventDefault();

      const href = link.dataset.pageLink!;
      const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const timer = setTimeout(done, TIMEOUT_MS);
            function done() {
              clearTimeout(timer);
              pending.current = null;
              resolve();
            }
            pending.current = { hash, resolve: done };
            router.push(href, { scroll: false });
          }),
      );
      transition.ready.then(animate, () => {});
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // Новая страница в DOM: ставим прокрутку (вверх или к блоку из #якоря) до снимка новой страницы.
  useEffect(() => {
    const next = pending.current;
    if (!next) return;
    const target = next.hash ? document.getElementById(decodeURIComponent(next.hash.slice(1))) : null;
    if (target) {
      target.scrollIntoView({ block: "start" });
      target.focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
    }
    next.resolve();
  }, [pathname]);

  return null;
}

function animate() {
  const root = document.documentElement;
  root.animate(growKeyframes(0, 0, SMALL), { duration: DURATION_MS, pseudoElement: "::view-transition-new(root)", fill: "both" });
  root.animate(
    [{ filter: "none" }, { filter: "brightness(0.35) blur(6px)" }],
    { duration: DURATION_MS * 0.6, easing: "ease", pseudoElement: "::view-transition-old(root)", fill: "forwards" },
  );
}

const samePath = (a: string, b: string) => a.replace(/\/$/, "") === b.replace(/\/$/, "");
