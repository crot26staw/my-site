import type { Metadata } from "next";
import { LegalPage } from "@/components/Legal/LegalPage";
import { privacyPath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { pageMetadata, withName } from "@/lib/seo";

// Служебный документ: в поиске не нужен, ссылки с него учитываются
export async function generateMetadata(): Promise<Metadata> {
  const { site, privacy } = await getContent();
  return {
    ...pageMetadata({ site, title: withName(privacy.title, site), description: privacy.seoDescription, path: privacyPath }),
    robots: { index: false, follow: true },
  };
}

/** Шаблон под 152-ФЗ. Текст — в админке, раздел «Документы»; перед запуском — показать юристу. */
export default async function Page() {
  const { privacy } = await getContent();
  return <LegalPage path={privacyPath} doc={privacy} />;
}
