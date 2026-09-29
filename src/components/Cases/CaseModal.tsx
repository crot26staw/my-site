"use client";

import { useEffect, useRef, useState } from "react";
import p from "@/app/detail.module.css";
import { casePath, detailedCases } from "@/config/cases";
import { site } from "@/config/site";
import { asset } from "@/lib/asset";
import { Breadcrumbs, type Crumb } from "../Breadcrumbs/Breadcrumbs";
import { Modal, type ModalHandle } from "../Modal/Modal";
import s from "./CaseModal.module.css";

const isUrl = (v: string) => /^https?:\/\//.test(v);
const findCase = (slug: string | undefined) => detailedCases.find((c) => c.slug === slug);

/** Путь страницы без базового пути GitHub Pages и завершающего «/»: "/", "/cases", "/cases/<slug>". */
const currentPath = () => window.location.pathname.slice(asset("/").length - 1).replace(/(.)\/$/, "$1") || "/";

/** Кейс из адреса страницы: /cases/<slug>. */
function slugFromLocation(): string | undefined {
  return findCase(currentPath().match(/^\/cases\/([^/]+)$/)?.[1])?.slug;
}

/**
 * Кейс подробно — модалка во всю ширину блоков. Открывается по клику на ссылку с data-case="<slug>"
 * и меняет адрес на /cases/<slug> (без перезагрузки), закрытие возвращает прежний адрес.
 * initial — прямой заход на /cases/<slug>: модалка открыта сразу поверх списка кейсов.
 */
export function CaseModal({ initial }: { initial?: string }) {
  const [slug, setSlug] = useState(initial);
  const modal = useRef<ModalHandle>(null);
  // Адрес кейса добавлен в историю нами — закрытие = шаг назад по истории
  const pushed = useRef(false);
  // Заголовок вкладки под модалкой: при прямом заходе на кейс под ней — список кейсов
  const pageTitle = useRef(initial ? `Кейсы — ${site.name}` : "");
  // Страница под модалкой: крошка на неё не переходит, а закрывает модалку
  const pagePath = useRef(initial ? "/cases" : "");

  const item = findCase(slug);

  const showTitle = (next: string | undefined) => {
    const c = findCase(next);
    if (c) document.title = `${c.title} — ${site.name}`;
  };

  const restoreTitle = () => {
    if (pageTitle.current) document.title = pageTitle.current;
  };

  // Кнопки «назад/вперёд» браузера
  useEffect(() => {
    const onPop = () => {
      const next = slugFromLocation();
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

function CaseDetail({
  item: c,
  renderLink,
}: {
  item: (typeof detailedCases)[number];
  renderLink: (crumb: Crumb, className: string) => React.ReactNode | undefined;
}) {
  const d = c.details;
  return (
    <article className={s.case}>
      <div className={s.crumbs}>
        <Breadcrumbs
          items={[
            { label: "Кейсы", href: "/cases" },
            { label: c.title, href: casePath(c.slug) },
          ]}
          renderLink={renderLink}
        />
      </div>
      <h2 id="case-modal-title" className={s.title}>
        {c.title}
      </h2>
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
          <h3 className={p.heading}>Задача</h3>
          {d.task.map((text) => (
            <p key={text} className={s.text}>
              {text}
            </p>
          ))}
        </section>
        <section>
          <h3 className={p.heading}>Что сделали</h3>
          <ul className={`${p.list} ${p.checks}`}>
            {d.done.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className={s.result}>
        <h3 className={p.heading}>Результат</h3>
        {d.result.map((text) => (
          <p key={text} className={s.text}>
            {text}
          </p>
        ))}
      </section>

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

      <p className="cta-line">
        <span>Хотите такой же результат? Расскажите о задаче, и мы предложим решение со сроками и стоимостью.</span>
        {isUrl(c.url) && (
          <a href={c.url} target="_blank" rel="noopener" className="btn btn--outline">
            Посмотреть сайт
          </a>
        )}
        <a href="#contact" data-lead="new" className="btn btn--primary">
          Обсудить проект
        </a>
      </p>
    </article>
  );
}
