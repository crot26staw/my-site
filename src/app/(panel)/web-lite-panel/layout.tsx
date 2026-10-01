import type { Metadata, Viewport } from "next";
import "./panel.css";

export const metadata: Metadata = {
  title: { template: "%s — Админка", default: "Админка" },
  robots: { index: false, follow: false, nocache: true },
  // Ссылку на админку не передаём сторонним сайтам
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

/** Корневой layout админки: свои стили, без 3D-сцены и шрифтов сайта. */
export default function PanelRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
