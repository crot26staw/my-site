import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionEditor, type RevisionInfo } from "@/components/panel/SectionEditor";
import { getSection } from "@/content/sections";
import { requireUser } from "@/lib/server/auth";
import { readSection } from "@/lib/server/content";
import { query } from "@/lib/server/db";

interface Props {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getSection((await params).key)?.title ?? "Раздел" };
}

export default async function ContentPage({ params }: Props) {
  await requireUser();
  const { key } = await params;
  if (!getSection(key)) notFound();
  const state = await readSection(key);
  const revisions = await query<{ id: string; version: number; created_at: Date; author: string | null; note: string | null }>(
    `SELECT r.id, r.version, r.created_at, u.name AS author, r.note
     FROM content_revisions r LEFT JOIN users u ON u.id = r.created_by
     WHERE r.key = $1 ORDER BY r.id DESC LIMIT 30`,
    [key],
  );
  const list: RevisionInfo[] = revisions.map((r) => ({
    id: Number(r.id),
    version: r.version,
    createdAt: r.created_at.toISOString(),
    author: r.author,
    note: r.note,
  }));
  // key: при переходе к другому разделу редактор начинается заново
  return <SectionEditor key={key} sectionKey={key} initialData={state.data} initialVersion={state.version} revisions={list} />;
}
