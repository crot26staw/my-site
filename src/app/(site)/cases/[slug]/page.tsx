import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CasesPage } from "@/components/Cases/CasesPage";
import { fill } from "@/content/schema";
import { detailedCases } from "@/lib/clientContent";
import { casePath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { pageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

async function findCase(slug: string) {
  return detailedCases((await getContent()).cases).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await findCase((await params).slug);
  if (!item) return {};
  const { site, pages } = await getContent();
  return pageMetadata({
    site,
    title: fill(pages.cases.caseSeoTitle, { кейс: item.title }),
    description: item.description ?? `Задача: ${item.task} Результат: ${item.result}`,
    path: casePath(item.slug),
    type: "article",
    image: item.image?.startsWith("/") ? item.image : undefined,
  });
}

/** Кейс подробно: список кейсов, поверх открыта модалка кейса (src/components/Cases/CaseModal.tsx). */
export default async function CasePage({ params }: Props) {
  const item = await findCase((await params).slug);
  if (!item) notFound();
  return <CasesPage caseSlug={item.slug} />;
}
