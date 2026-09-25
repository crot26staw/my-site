import type { Metadata } from "next";
import { CaseGrid } from "@/components/Cases/CaseCard";
import { FloatingTelegram } from "@/components/FloatingTelegram";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Modals } from "@/components/Modals";
import { PageEffects } from "@/components/PageEffects";
import { Room } from "@/components/Room/Room";
import { cases } from "@/config/cases";
import { site } from "@/config/site";
import s from "../subpage.module.css";

const title = `Кейсы — ${site.name}`;
const description = "Сайты, которые мы сделали: с какой задачей пришёл клиент и что изменилось после запуска.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/cases" },
  openGraph: { type: "website", locale: "ru_RU", siteName: site.name, title, description, url: "/cases" },
};

/** Все кейсы. На главной — только первые из списка (src/config/cases.ts). */
export default function CasesPage() {
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="cases" />
      <main className={s.main}>
        <Room
          id="cases"
          room="cases"
          breadcrumbs={[{ label: "Кейсы", href: "/cases" }]}
          title="Наши работы"
          lead="Каждый проект начинается с задачи клиента. Показываем, с чем к нам пришли и что получилось в итоге."
        >
          <CaseGrid items={cases} />

          <p className="cta-line" data-reveal>
            <span>Хотите такой же результат? Расскажите о задаче, и мы покажем похожие проекты из вашей ниши.</span>
            <a href="#contact" data-lead="new" className="btn btn--primary">
              Обсудить проект
            </a>
          </p>
        </Room>
      </main>
      <Footer page="cases" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
