import d from "@/app/detail.module.css";
import type { LegalDoc } from "@/content/types";
import s from "@/app/subpage.module.css";
import { FloatingTelegram } from "../FloatingTelegram";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { Modals } from "../Modals";
import { PageEffects } from "../PageEffects";
import { Room } from "../Room/Room";
import l from "./Legal.module.css";

/** Юридический документ (политика, согласие): общая обёртка страницы. */
export function LegalPage({ path, doc: { title, lead, sections } }: { path: string; doc: LegalDoc }) {
  return (
    <>
      <div className="scene scene--plain" aria-hidden="true" />
      <Header page="legal" />
      <main className={s.main}>
        <Room id="legal" room="faq" breadcrumbs={[{ label: title, href: path }]} title={title} lead={lead}>
          <div className={l.doc}>
            {sections.map((section, i) => (
              <section key={i} className={l.section}>
                <h2 className={d.heading}>
                  {i + 1}. {section.title}
                </h2>
                {section.text?.map((text) => (
                  <p key={text} className={l.text}>
                    {text}
                  </p>
                ))}
                {section.list && section.list.length > 0 && (
                  <ul className={d.list}>
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </Room>
      </main>
      <Footer page="legal" />
      <FloatingTelegram />
      <Modals />
      <PageEffects />
    </>
  );
}
