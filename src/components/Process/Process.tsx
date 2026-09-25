import { paymentSchedule, site, supportDays } from "@/config/site";
import { Room } from "../Room/Room";
import s from "./Process.module.css";

const steps = [
  {
    title: "Заявка и знакомство",
    text: "Вы оставляете заявку, мы связываемся в удобном вам мессенджере или по телефону, обсуждаем задачу и называем примерную стоимость.",
    term: `до ${site.responseMinutes} минут`,
  },
  {
    title: "Бриф и договор",
    text: "Уточняем детали: цели сайта, аудиторию, конкурентов, пожелания по стилю. Фиксируем цену и сроки в договоре.",
    term: "[1] день",
  },
  {
    title: "Прототип и структура",
    text: "Собираем структуру сайта и схему расположения блоков. Вы сразу видите, как будет устроен сайт, и вносите правки до начала дизайна.",
    term: "от [2] дней",
  },
  {
    title: "Дизайн и тексты",
    text: "Создаём дизайн под вашу аудиторию и пишем продающие тексты. Показываем результат и вносим до двух раундов правок.",
    term: "от [3] дней",
  },
  {
    title: "Разработка",
    text: "Верстаем сайт, настраиваем систему управления, подключаем формы, аналитику и нужные интеграции. Проводим SEO-оптимизацию.",
    term: "от [3] дней",
  },
  {
    title: "Тестирование и запуск",
    text: "Проверяем сайт на разных устройствах и браузерах, вносим финальные правки и публикуем. Показываем, как самостоятельно менять контент.",
    term: "[1] день",
  },
  {
    title: "Поддержка",
    text: "После запуска остаёмся на связи: помогаем с вопросами и исправляем ошибки.",
    term: `${supportDays} дней бесплатно`,
  },
];

export function Process() {
  const pay = paymentSchedule;
  return (
    <Room
      id="process"
      room="process"
      index="06"
      title="Прозрачный процесс: вы видите результат на каждом этапе"
      lead="Никаких «чёрных ящиков». Вы знаете, что происходит с проектом, согласовываете каждый этап и платите частями."
    >
      <ol className={s.timeline}>
        {steps.map((step, i) => (
          <li key={step.title} className={s.step} data-reveal>
            <span className={s.num} aria-hidden="true">
              {i + 1}
            </span>
            <h3 className={s.title}>
              <span className="visually-hidden">Этап {i + 1}. </span>
              {step.title}
            </h3>
            <p className={s.text}>{step.text}</p>
            <p className={s.term}>{step.term}</p>
          </li>
        ))}
      </ol>

      <p className={s.payment} data-reveal>
        <strong>Поэтапная оплата.</strong> {pay.afterContract}% после подписания договора, {pay.afterDesign}% после
        согласования дизайна, {pay.afterLaunch}% после запуска. Вы платите только за то, что уже увидели и одобрили.
      </p>
      <p className={s.note}>Сроки указаны для лендинга, для других проектов рассчитываются индивидуально.</p>

      <div data-reveal>
        <a href="#contact" data-lead="new" className="btn btn--primary">
          Начать с бесплатной консультации
        </a>
      </div>
    </Room>
  );
}
