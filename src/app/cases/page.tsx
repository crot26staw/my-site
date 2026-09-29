import type { Metadata } from "next";
import { CasesPage } from "@/components/Cases/CasesPage";
import { site } from "@/config/site";

const title = `Кейсы — ${site.name}`;
const description = "Сайты, которые мы сделали: с какой задачей пришёл клиент и что изменилось после запуска.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/cases" },
  openGraph: { type: "website", locale: "ru_RU", siteName: site.name, title, description, url: "/cases" },
};

/** Все кейсы. На главной — только первые из списка (src/config/cases.ts). */
export default function Page() {
  return <CasesPage />;
}
