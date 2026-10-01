import type { Metadata } from "next";
import { Faq } from "@/components/Faq/Faq";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import s from "@/app/subpage.module.css";
import { getContent } from "@/lib/server/content";
import { pageMetadata, withName } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { site, pages } = await getContent();
  return pageMetadata({ site, title: withName(pages.faq.seoTitle, site), description: pages.faq.seoDescription, path: "/faq" });
}

/** Все вопросы. На главной — только первые из списка (сколько — в админке, блок «Частые вопросы»). */
export default function FaqPage() {
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="faq" />
      <main className={s.main}>
        <Faq page />
      </main>
      <Footer page="faq" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
