import { faq, homeFaq } from "@/config/faq";
import { site } from "@/config/site";
import { TelegramIcon } from "../icons";
import { PageLink } from "../PageLink";
import { Room } from "../Room/Room";
import { FaqList } from "./FaqList";
import s from "./Faq.module.css";

/** Блок вопросов: на главной — первые из списка и ссылка на /faq, на странице /faq (page) — все. */
export function Faq({ page = false }: { page?: boolean }) {
  const items = page ? faq : homeFaq;
  // Разметка FAQPage — только для вопросов, которые видны на этой странице.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <Room
      id="faq"
      room="faq"
      title="Частые вопросы"
      {...(page ? { breadcrumbs: [{ label: "Частые вопросы", href: "/faq" }] } : { index: "10" })}
    >
      <FaqList items={items} />

      <div className={s.actions} data-reveal>
        {!page && (
          <PageLink href="/faq" className="btn btn--outline">
            Все вопросы
          </PageLink>
        )}
        <a href={site.contacts.telegramUrl} target="_blank" rel="noopener" className="btn btn--outline">
          <TelegramIcon />
          Не нашли ответ? Задайте вопрос
        </a>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Room>
  );
}
