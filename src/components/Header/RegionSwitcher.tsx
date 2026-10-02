"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useSiteContent } from "../ContentProvider";
import { PinIcon } from "../icons";
import s from "./Header.module.css";

/**
 * Выбор города: ссылки на ту же страницу на основном домене или поддомене региона.
 * Обычные <a> — поисковики видят связи между поддоменами. Без регионов в админке не показывается.
 * header — кнопка со списком в шапке, drawer — список в мобильном меню.
 */
export function RegionSwitcher({ variant }: { variant: "header" | "drawer" }) {
  const { regions } = useSiteContent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (!regions.links.length) return null;
  const current = regions.links.find((r) => r.slug === regions.current) ?? regions.links[0];

  const list = (
    <ul className={s.regionList} id={listId} aria-label="Выбор города">
      {regions.links.map((r) => (
        <li key={r.slug ?? ""}>
          <a href={`${r.url}${pathname}`} className={s.regionLink} aria-current={r === current ? "true" : undefined}>
            {r.name}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === "drawer") {
    return (
      <div className={s.drawerRegions}>
        <p className={s.drawerRegionsTitle}>
          <PinIcon /> Город
        </p>
        {list}
      </div>
    );
  }

  return (
    <div ref={ref} className={s.region} data-open={open || undefined}>
      <button
        type="button"
        className={s.regionButton}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Город: ${current.name}. Выбрать другой`}
        title={current.name}
        onClick={() => setOpen((v) => !v)}
      >
        <PinIcon />
        <span>{current.name}</span>
        <svg className={s.regionChevron} viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {list}
    </div>
  );
}
