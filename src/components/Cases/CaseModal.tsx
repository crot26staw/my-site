"use client";

import { useEffect, useRef, useState } from "react";
import p from "@/app/detail.module.css";
import { fill } from "@/content/schema";
import type { DetailedCase } from "@/content/types";
import { asset } from "@/lib/asset";
import type { ClientContent } from "@/lib/clientContent";
import { casePath, isUrl } from "@/lib/paths";
import { siteUrlOf, withName } from "@/lib/seo";
import { Breadcrumbs, type Crumb } from "../Breadcrumbs/Breadcrumbs";
import { useSiteContent } from "../ContentProvider";
import { Modal, type ModalHandle } from "../Modal/Modal";
import s from "./CaseModal.module.css";

const findIn = (items: DetailedCase[], slug: string | undefined) => items.find((c) => c.slug === slug);

/** Путь страницы без базового пути GitHub Pages и завершающего «/»: "/", "/cases", "/cases/<slug>". */
const currentPath = () => window.location.pathname.slice(asset("/").length - 1).replace(/(.)\/$/, "$1") || "/";

/** Кейс из адреса страницы: /cases/<slug>. */
function slugFromLocation(items: DetailedCase[]): string | undefined {
  return findIn(items, currentPath().match(/^\/cases\/([^/]+)$/)?.[1])?.slug;
}

/**
 * Кейс подробно — модалка во всю ширину блоков. Открывается по клику на ссылку с data-case="<slug>"
 * и меняет адрес на /cases/<slug> (без перезагрузки), закрытие возвращает прежний адрес.
 * initial — прямой заход на /cases/<slug>: модалка открыта сразу поверх списка кейсов.
 */
export function CaseModal({ initial }: { initial?: string }) {
  const { site, cases } = useSiteContent();
  const findCase = (slug: string | undefined) => findIn(cases.items, slug);
  const [slug, setSlug] = useState(initial);
  const modal = useRef<ModalHandle>(null);
  // Адрес кейса добавлен в историю нами — закрытие = шаг назад по истории
  const pushed = useRef(false);
  // Заголовок вкладки под модалкой: при прямом заходе на кейс под ней — список кейсов
  const pageTitle = useRef(initial ? withName(cases.labels.seoTitle, site) : "");
  // Страница под модалкой: крошка на неё не переходит, а закрывает модалку
  const pagePath = useRef(initial ? "/cases" : "");

  const item = findCase(slug);

  const showTitle = (next: string | undefined) => {
    const c = findCase(next);
    if (c) document.title = fill(cases.labels.caseSeoTitle, { кейс: c.title });
  };

  const restoreTitle = () => {
    if (pageTitle.current) document.title = pageTitle.current;
  };

  // Кнопки «назад/вперёд» браузера
  useEffect(() => {
    const onPop = () => {
      const next = slugFromLocation(cases.items);
      if (next) {
        if (!pageTitle.current) pageTitle.current = document.title;
        setSlug(next);
        showTitle(next);
        modal.current?.open();
      } else {
        pushed.current = false;
        restoreTitle();
        modal.current?.close();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Модалку закрыли: возвращаем адрес и заголовок страницы под ней
  const leave = () => {
    restoreTitle();
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      // Зашли прямо на адрес кейса — остаёмся на списке кейсов
      window.history.replaceState(null, "", asset("/cases"));
    }
  };

  return (
    <Modal
      trigger="case"
      labelledBy="case-modal-title"
      size="full"
      initialOpen={!!initial}
      handle={modal}
      onTrigger={(link, open) => {
        const next = link.dataset.case;
        if (!findCase(next)) return;
        const href = asset(casePath(next!));
        if (open) {
          window.history.replaceState(null, "", href);
        } else {
          pageTitle.current = document.title;
          pagePath.current = currentPath();
          window.history.pushState(null, "", href);
          pushed.current = true;
        }
        setSlug(next);
        showTitle(next);
      }}
      onDismiss={leave}
    >
      {item && (
        <CaseDetail
          item={item}
          labels={cases.labels}
          siteUrl={siteUrlOf(site)}
          isPage={item.slug === initial}
          renderLink={(crumb, className) =>
            crumb.href === pagePath.current ? (
              <a
                href={asset(crumb.href)}
                className={className}
                onClick={(e) => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  modal.current?.close();
                  leave();
                }}
              >
                {crumb.label}
              </a>
            ) : undefined
          }
        />
      )}
    </Modal>
  );
}

/** isPage — это и есть страница /cases/<slug>: заголовок h1 и разметка крошек (список под модалкой их не даёт). */
function CaseDetail({
  item: c,
  labels,
  siteUrl,
  isPage,
  renderLink,
}: {
  item: DetailedCase;
  labels: ClientContent["cases"]["labels"];
  siteUrl: string;
  isPage: boolean;
  renderLink: (crumb: Crumb, className: string) => React.ReactNode | undefined;
}) {
  const d = c.details;
  const Title = isPage ? "h1" : "h2";
  return (
    <article className={s.case}>
      <div className={s.crumbs}>
        <Breadcrumbs
          items={[
            { label: labels.title, href: "/cases" },
            { label: c.title, href: casePath(c.slug) },
          ]}
          renderLink={renderLink}
          jsonLd={isPage}
          siteUrl={siteUrl}
        />
      </div>
      <Title id="case-modal-title" className={s.title}>
        {c.title}
      </Title>
      <p className={s.client}>{d.client}</p>

      <ul className={s.tags} aria-label="Что делали">
        {d.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      <dl className={s.facts}>
        {d.facts.map((f) => (
          <div key={f.label} className={s.fact}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className={p.columns}>
        <section>
          <h3 className={p.heading}>{labels.detailTask}</h3>
          {d.task.map((text) => (
            <p key={text} className={s.text}>
              {text}
            </p>
          ))}
        </section>
        <section>
          <h3 className={p.heading}>{labels.detailDone}</h3>
          <ul className={`${p.list} ${p.checks}`}>
            {d.done.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className={s.result}>
        <h3 className={p.heading}>{labels.detailResult}</h3>
        {d.result.map((text) => (
          <p key={text} className={s.text}>
            {text}
          </p>
        ))}
      </section>

      {d.screenshot && (
        <figure className={s.browser}>
          <div className={s.bar} aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{isUrl(c.url) ? c.url.replace(/^https?:\/\//, "") : c.title}</span>
          </div>
          <img
            src={asset(d.screenshot.src)}
            alt={`Сайт целиком: ${c.title}`}
            width={d.screenshot.width}
            height={d.screenshot.height}
            loading="lazy"
            decoding="async"
          />
        </figure>
      )}

      <p className="cta-line">
        <span>{labels.detailCta}</span>
        {isUrl(c.url) && (
          <a href={c.url} target="_blank" rel="noopener" className="btn btn--outline">
            {labels.viewSite}
          </a>
        )}
        <a href="#contact" data-lead="new" className="btn btn--primary">
          {labels.discussButton}
        </a>
      </p>
    </article>
  );
}
