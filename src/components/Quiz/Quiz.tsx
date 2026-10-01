import { getContent } from "@/lib/server/content";
import { Room } from "../Room/Room";
import { QuizWidget } from "./QuizWidget";

export async function Quiz() {
  const t = (await getContent()).quiz.texts;
  return (
    <Room id="quiz" room="quiz" index="07" hideFab title={t.title} lead={t.lead}>
      <QuizWidget />
    </Room>
  );
}
