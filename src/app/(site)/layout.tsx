import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import { headers } from "next/headers";
import { ContentProvider } from "@/components/ContentProvider";
import { PageTransition } from "@/components/PageTransition";
import { clientContentOf } from "@/lib/clientContent";
import { getContent } from "@/lib/server/content";
import { pageMetadata, siteUrlOf } from "@/lib/seo";
import { VIEW_MODE_SCRIPT } from "@/lib/viewModeScript";
import "lenis/dist/lenis.css";
import "../globals.css";

const display = Unbounded({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--font-mono" });

export async function generateMetadata(): Promise<Metadata> {
  const { site, pages } = await getContent();
  return {
    // Относительные адреса ("/cases") дополняются до https://<домен>/cases
    metadataBase: new URL(siteUrlOf(site)),
    ...pageMetadata({ site, title: pages.home.seoTitle, description: pages.home.seoDescription, path: "/" }),
  };
}

export const viewport: Viewport = {
  themeColor: "#04050a",
  viewportFit: "cover",
  colorScheme: "dark",
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Nonce для Content-Security-Policy ставит src/proxy.ts: без него браузер не выполнит инлайн-скрипт
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const content = await getContent();
  return (
    // suppressHydrationWarning: инлайн-скрипт ниже добавляет класс js и data-mode до гидратации
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Скрываем [data-reveal] до появления только когда JS доступен; режим 3D/обычный — до первой отрисовки */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js');${VIEW_MODE_SCRIPT}` }} />
      </head>
      <body id="top">
        <ContentProvider value={clientContentOf(content)}>
          {children}
          <PageTransition />
        </ContentProvider>
      </body>
    </html>
  );
}
