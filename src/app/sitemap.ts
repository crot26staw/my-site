import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { detailedCases } from "@/lib/clientContent";
import { casePath, servicePath, siteTypePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { absoluteUrl, siteUrlOf } from "@/lib/seo";

/** sitemap.xml: все страницы для поиска, кроме служебных (/privacy, /consent закрыты от индексации). Собирается по запросу из базы. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const { site, services, siteTypes, cases } = await getContent();
  const paths = [
    "/",
    "/services",
    ...services.map((s) => servicePath(s.id)),
    "/sites",
    ...siteTypes.map((t) => siteTypePath(t.id)),
    "/cases",
    ...detailedCases(cases).map((c) => casePath(c.slug)),
    "/faq",
  ];
  const base = siteUrlOf(site);
  return paths.map((path) => ({ url: absoluteUrl(base, path) }));
}
