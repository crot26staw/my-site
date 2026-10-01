import type { Metadata } from "next";
import { LegalPage } from "@/components/Legal/LegalPage";
import { consentPath } from "@/lib/paths";
import { getContent } from "@/lib/server/content";
import { pageMetadata, withName } from "@/lib/seo";

// Служебный документ: в поиске не нужен, ссылки с него учитываются
export async function generateMetadata(): Promise<Metadata> {
  const { site, consent } = await getContent();
  return {
    ...pageMetadata({ site, title: withName(consent.title, site), description: consent.seoDescription, path: consentPath }),
    robots: { index: false, follow: true },
  };
}

/** Шаблон под 152-ФЗ. Текст — в админке, раздел «Документы»; перед запуском — показать юристу. */
export default async function Page() {
  const { consent } = await getContent();
  return <LegalPage path={consentPath} doc={consent} />;
}
