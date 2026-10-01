import s from "@/app/subpage.module.css";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { PageLink } from "@/components/PageLink";

/** Страница не найдена: удалённый кейс или услуга, опечатка в адресе. */
export default function NotFound() {
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="legal" />
      <main className={s.main}>
        <section className="not-found">
          <p className="eyebrow">// 404</p>
          <h1 className="section-title">Такой страницы нет</h1>
          <p className="section-lead">Возможно, её удалили или в адресе опечатка.</p>
          <PageLink href="/" className="btn btn--primary">
            На главную
          </PageLink>
        </section>
      </main>
      <Footer page="legal" />
    </>
  );
}
