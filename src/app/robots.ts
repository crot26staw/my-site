import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getContent } from "@/lib/server/content";
import { absoluteUrl, siteUrlOf } from "@/lib/seo";

/**
 * robots.txt: всё открыто, ссылка на карту сайта. Адрес админки здесь намеренно не упомянут —
 * robots.txt читают все, включая тех, кто ищет админки; её страницы закрыты заголовком X-Robots-Tag.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const { site } = await getContent();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl(siteUrlOf(site), "/sitemap.xml"),
  };
}
