import { Room } from "../Room/Room";
import { QuizWidget } from "./QuizWidget";

/** Общие для блока на главной и модалки квиза. */
export const QUIZ_TITLE = "Узнайте стоимость вашего сайта за 1 минуту";
export const QUIZ_LEAD =
  "Ответьте на 5 вопросов, и мы покажем примерную стоимость. Точную цену рассчитаем лично и зафиксируем в договоре.";

export function Quiz() {
  return (
    <Room id="quiz" room="quiz" index="07" hideFab title={QUIZ_TITLE} lead={QUIZ_LEAD}>
      <QuizWidget />
    </Room>
  );
}
