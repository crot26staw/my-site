import type { Metadata } from "next";
import { Faq } from "@/components/Faq/Faq";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { site } from "@/config/site";
import s from "../subpage.module.css";

const title = `Частые вопросы — ${site.name}`;
const description = "Ответы на частые вопросы: сроки, оплата, правки, права на сайт, домен и хостинг, поддержка после запуска.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/faq" },
  openGraph: { type: "website", locale: "ru_RU", siteName: site.name, title, description, url: "/faq" },
};

/** Все вопросы. На главной — только первые из списка (src/config/faq.ts). */
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
