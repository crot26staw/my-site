import type { Metadata } from "next";
import { CasesPage } from "@/components/Cases/CasesPage";
import { getContent } from "@/lib/server/content";
import { pageMetadata, withName } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { site, pages } = await getContent();
  return pageMetadata({ site, title: withName(pages.cases.seoTitle, site), description: pages.cases.seoDescription, path: "/cases" });
}

/** Все кейсы. На главной — только первые из списка (сколько — в админке, блок «Наши работы»). */
export default function Page() {
  return <CasesPage />;
}
