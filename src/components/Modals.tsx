import { LeadModal } from "./LeadModal/LeadModal";
import { QuizModal } from "./Quiz/QuizModal";

/** Модалки, которые открываются кнопками с data-lead и data-quiz, — на каждой странице. */
export function Modals() {
  return (
    <>
      <LeadModal />
      <QuizModal />
    </>
  );
}
