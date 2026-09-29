import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CasesPage } from "@/components/Cases/CasesPage";
import { casePath, detailedCases } from "@/config/cases";
import { site } from "@/config/site";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Страницы собираются заранее (статический экспорт) — только для кейсов со slug и details. */
export const dynamicParams = false;

export function generateStaticParams() {
  return detailedCases.map((c) => ({ slug: c.slug }));
}

const findCase = (slug: string) => detailedCases.find((c) => c.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = findCase((await params).slug);
  if (!item) return {};
  const title = `${item.title} — ${site.name}`;
  const description = `Задача: ${item.task} Результат: ${item.result}`;
  const url = casePath(item.slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "ru_RU", siteName: site.name, title, description, url, images: [item.image] },
  };
}

/** Кейс подробно: список кейсов, поверх открыта модалка кейса (src/components/Cases/CaseModal.tsx). */
export default async function CasePage({ params }: Props) {
  const item = findCase((await params).slug);
  if (!item) notFound();
  return <CasesPage caseSlug={item.slug} />;
}
