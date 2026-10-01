"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PANEL_PATH } from "@/lib/paths";

export interface NavGroup {
  title: string;
  links: { href: string; label: string; badge?: number }[];
}

/** Меню админки. На телефоне выезжает по кнопке «Меню». */
export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Перешли на другую страницу — меню на телефоне закрываем
  useEffect(() => setOpen(false), [pathname]);

  const isCurrent = (href: string) => (href === PANEL_PATH ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <button type="button" className="btn btn-sm menu-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="panel-nav">
        {open ? "Закрыть" : "Меню"}
      </button>
      <nav id="panel-nav" className="sidebar" data-open={open || undefined} aria-label="Разделы админки">
        <Link href={PANEL_PATH} className="brand">
          Web-Lite <small>админка</small>
        </Link>
        {groups.map((g, i) => (
          <div key={i}>
            {g.title && <div className="nav-group">{g.title}</div>}
            {g.links.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link" aria-current={isCurrent(link.href) ? "page" : undefined}>
                <span>{link.label}</span>
                {link.badge ? (
                  <span className="badge" aria-label={`новых: ${link.badge}`}>
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
