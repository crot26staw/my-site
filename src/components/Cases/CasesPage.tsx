import { getContent } from "@/lib/server/content";
import { FloatingTelegram } from "../FloatingTelegram";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { Modals } from "../Modals";
import { PageEffects } from "../PageEffects";
import { Room } from "../Room/Room";
import s from "@/app/subpage.module.css";
import { CaseGrid } from "./CaseCard";

/** Страница всех кейсов. caseSlug — адрес кейса /cases/<slug>: тот же список, поверх открыт кейс. */
export async function CasesPage({ caseSlug }: { caseSlug?: string }) {
  const { cases, pages } = await getContent();
  const t = pages.cases;
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="cases" />
      <main className={s.main}>
        <Room
          id="cases"
          room="cases"
          breadcrumbs={[{ label: t.title, href: "/cases" }]}
          underlay={!!caseSlug}
          title={t.title}
          lead={t.lead}
        >
          <CaseGrid items={cases} labels={t} />

          <p className="cta-line" data-reveal>
            <span>{t.ctaText}</span>
            <a href="#contact" data-lead="new" className="btn btn--primary">
              {t.discussButton}
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
