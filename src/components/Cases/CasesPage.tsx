import { cases } from "@/config/cases";
import { FloatingTelegram } from "../FloatingTelegram";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { Modals } from "../Modals";
import { PageEffects } from "../PageEffects";
import { Room } from "../Room/Room";
import s from "@/app/subpage.module.css";
import { CaseGrid } from "./CaseCard";

/** Страница всех кейсов. caseSlug — адрес кейса /cases/<slug>: тот же список, поверх открыт кейс. */
export function CasesPage({ caseSlug }: { caseSlug?: string }) {
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
      <Modals caseSlug={caseSlug} />
      <PageEffects />
    </>
  );
}
