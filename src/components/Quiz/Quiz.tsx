import { Room } from "../Room/Room";
import { QuizWidget } from "./QuizWidget";

export function Quiz() {
  return (
    <Room
      id="quiz"
      room="quiz"
      index="07"
      hideFab
      title="Узнайте стоимость вашего сайта за 1 минуту"
      lead="Ответьте на 5 вопросов, и мы покажем примерную стоимость. Точную цену рассчитаем лично и зафиксируем в договоре."
    >
      <QuizWidget />
    </Room>
  );
}
