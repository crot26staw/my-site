"use client";

import { useState } from "react";
import { roomStyle } from "@/config/rooms";
import { plans, type PlanId } from "@/config/site";
import { Modal } from "../Modal/Modal";
import { QUIZ_LEAD, QUIZ_TITLE } from "./Quiz";
import { QuizWidget } from "./QuizWidget";
import s from "./Quiz.module.css";

const isPlan = (v: string | undefined): v is PlanId => !!v && v in plans;

/**
 * Квиз в модалке. Открывается по клику на любую ссылку с data-quiz (href="#quiz" — запасной путь без JS);
 * data-plan у кнопки тарифа заранее выбирает тариф в первом вопросе.
 */
export function QuizModal() {
  // Квиз монтируется при первом открытии и начинается заново при каждом следующем.
  const [session, setSession] = useState(0);
  const [plan, setPlan] = useState<PlanId>();

  return (
    <Modal
      trigger="quiz"
      labelledBy="quiz-modal-title"
      wide
      panelStyle={roomStyle("quiz")}
      onTrigger={(link, open) => {
        if (open) return;
        setPlan(isPlan(link.dataset.plan) ? link.dataset.plan : undefined);
        setSession((n) => n + 1);
      }}
    >
      <h2 id="quiz-modal-title" className={s.modalTitle}>
        {QUIZ_TITLE}
      </h2>
      <p className={s.modalLead}>{QUIZ_LEAD}</p>
      {session > 0 && <QuizWidget key={session} idPrefix="quiz-modal" initialPlan={plan} embedded />}
    </Modal>
  );
}
