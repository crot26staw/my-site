import { getContent } from "@/lib/server/content";
import { faqJsonLd, JsonLd } from "@/lib/seo";
import { TelegramIcon } from "../icons";
import { PageLink } from "../PageLink";
import { Room } from "../Room/Room";
import { FaqList } from "./FaqList";
import s from "./Faq.module.css";

/** Блок вопросов: на главной — первые из списка и ссылка на /faq, на странице /faq (page) — все. */
export async function Faq({ page = false }: { page?: boolean }) {
  const { faq, blocks, pages, site } = await getContent();
  const t = blocks.faq;
  const items = page ? faq : faq.slice(0, t.homeCount);

  return (
    <Room
      id="faq"
      room="faq"
      title={page ? pages.faq.title : t.title}
      {...(page ? { breadcrumbs: [{ label: pages.faq.title, href: "/faq" }] } : { index: "10" })}
    >
      <FaqList items={items} />

      <div className={s.actions} data-reveal>
        {!page && (
          <PageLink href="/faq" className="btn btn--outline">
            {t.allButton}
          </PageLink>
        )}
        <a href={site.contacts.telegramUrl} target="_blank" rel="noopener" className="btn btn--outline">
          <TelegramIcon />
          {t.askButton}
        </a>
      </div>

      {/* Разметка FAQPage — только на /faq: на главной те же вопросы, и две страницы с одной разметкой спорили бы в поиске */}
      {page && <JsonLd data={faqJsonLd(items)} />}
    </Room>
  );
}
