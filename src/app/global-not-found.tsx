import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false },
};

/** 404 для адресов, которых нет ни на сайте, ни в админке (у них разные корневые layout). */
export default function GlobalNotFound() {
  return (
    <html lang="ru">
      <body>
        <main className="not-found not-found--global">
          <p className="eyebrow">// 404</p>
          <h1 className="section-title">Такой страницы нет</h1>
          <p className="section-lead">Возможно, её удалили или в адресе опечатка.</p>
          <a href="/" className="btn btn--primary">
            На главную
          </a>
        </main>
      </body>
    </html>
  );
}
