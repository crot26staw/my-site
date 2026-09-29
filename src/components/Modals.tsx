import { CaseModal } from "./Cases/CaseModal";
import { LeadModal } from "./LeadModal/LeadModal";
import { QuizModal } from "./Quiz/QuizModal";

/**
 * Модалки, которые открываются кнопками с data-lead, data-quiz и data-case, — на каждой странице.
 * caseSlug — страница кейса /cases/<slug>: его модалка открыта сразу.
 */
export function Modals({ caseSlug }: { caseSlug?: string }) {
  return (
    <>
      <CaseModal initial={caseSlug} />
      <LeadModal />
      <QuizModal />
    </>
  );
}
