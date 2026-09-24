import { fromPrice, plans, type PlanId } from "@/config/site";
import { Room } from "../Room/Room";
import s from "./Pricing.module.css";

interface Tariff {
  id: PlanId;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const tariffs: Tariff[] = [
  {
    id: "landing",
    description: "Одностраничный сайт для продажи одного продукта или услуги.",
    features: [
      "Индивидуальный дизайн",
      "Продающие тексты",
      "Адаптация под мобильные",
      "Форма заявки и подключение мессенджеров",
      "Базовая SEO-оптимизация",
    ],
    cta: "Заказать лендинг",
  },
  {
    id: "corporate",
    description: "Сайт компании с описанием услуг, кейсами и контактами.",
    features: [
      "Всё, что входит в лендинг",
      "До [10] страниц",
      "Удобная система управления контентом",
      "Семантическое ядро и SEO-оптимизация",
      "Подключение аналитики",
    ],
    cta: "Заказать сайт",
    popular: true,
  },
  {
    id: "catalog",
    description: "Витрина товаров или услуг без онлайн-оплаты.",
    features: ["Каталог с категориями и фильтрами", "Карточки товаров", "Заявка на товар или расчёт", "SEO-оптимизация категорий и карточек"],
    cta: "Заказать каталог",
  },
  {
    id: "service",
    description: "Многостраничный сайт для онлайн-сервиса или продукта со сложной логикой.",
    features: [
      "Всё, что входит в корпоративный сайт",
      "Нестандартная структура под продукт",
      "Нишевые функции: калькуляторы, личные кабинеты, интеграции",
      "Интеграция с CRM",
    ],
    cta: "Обсудить проект",
  },
  {
    id: "shop",
    description: "Полноценный магазин с онлайн-оплатой и доставкой.",
    features: [
      "Всё, что входит в каталог",
      "Корзина и оформление заказа",
      "Онлайн-оплата и расчёт доставки",
      "Личный кабинет покупателя",
      "Интеграция с 1С или складом",
    ],
    cta: "Заказать магазин",
  },
];

export function Pricing() {
  return (
    <Room
      id="pricing"
      room="pricing"
      index="04"
      wide
      title="Прозрачные цены без скрытых доплат"
      lead="Цена фиксируется в договоре и не меняется в процессе работы. Итоговая стоимость зависит от объёма и сложности проекта, точный расчёт сделаем после короткого обсуждения."
    >
      <ul className={s.track} aria-label="Тарифы">
        {tariffs.map((t) => {
          const plan = plans[t.id];
          return (
            <li key={t.id} className={`${s.card} ${t.popular ? s.popular : ""}`} data-reveal>
              {t.popular && <span className={s.badge}>Популярный</span>}
              <h3 className={s.title}>{plan.title}</h3>
              <p className={s.price}>{fromPrice(plan.price)}</p>
              <p className={s.term}>{plan.term}</p>
              <p className={s.description}>
                <em>{t.description}</em>
              </p>
              <ul className={s.features}>
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href="#quiz" data-plan={t.id} className={`btn ${t.popular ? "btn--primary" : "btn--outline"} ${s.cta}`}>
                {t.cta}
              </a>
            </li>
          );
        })}
      </ul>

      <p className="cta-line" data-reveal>
        <span>Не знаете, какой вариант подходит именно вам? Ответьте на 5 вопросов и получите расчёт стоимости.</span>
        <a href="#quiz" className="btn btn--outline">
          Пройти тест за 1 минуту
        </a>
      </p>
    </Room>
  );
}
