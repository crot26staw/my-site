import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import { PageTransition } from "@/components/PageTransition";
import { site } from "@/config/site";
import { VIEW_MODE_SCRIPT } from "@/lib/viewModeScript";
import "lenis/dist/lenis.css";
import "./globals.css";

const display = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--font-mono" });

const title = `Сайты под ключ быстрее и дешевле — ${site.name}`;
const description =
  "Разработка сайтов, веб-дизайн, редизайн, SEO и продающие тексты. AI берёт на себя рутину, а дизайн, стратегию и контроль качества делают люди. Лендинг от 30 000 ₽.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: site.name,
    title,
    description,
    url: "/",
    // TODO: [og-image 1200×630]
  },
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: инлайн-скрипт ниже добавляет класс js и data-mode до гидратации
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Скрываем [data-reveal] до появления только когда JS доступен; режим 3D/обычный — до первой отрисовки */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js');${VIEW_MODE_SCRIPT}` }} />
      </head>
      <body id="top">
        {children}
        <PageTransition />
      </body>
    </html>
  );
}
