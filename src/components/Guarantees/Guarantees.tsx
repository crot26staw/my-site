import type { GuaranteeIcon } from "@/content/types";
import { getContent } from "@/lib/server/content";
import { Room } from "../Room/Room";
import s from "./Guarantees.module.css";

/** Линейные иконки 24×24, цвет — currentColor. */
const icons: Record<GuaranteeIcon, string> = {
  contract: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4",
  lock: "M6 11h12v10H6zM9 11V8a3 3 0 0 1 6 0v3M12 15v2",
  calendar: "M4 6h16v15H4zM4 10h16M9 3v5M15 3v5M9 15l2 2 4-4",
  steps: "M4 20h5v-5h5v-5h5V5M16 5h3v3",
  revisions: "M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4M9 12l2 2 4-4",
  key: "M14.5 9.5a4.5 4.5 0 1 1-2.9-4.2 4.5 4.5 0 0 1 2.9 4.2zM13 13l7 7M17 17l2-2M15 19l2-2",
  support: "M5 13v-1a7 7 0 0 1 14 0v1M5 13h3v6H5zM16 13h3v6h-3zM19 19a3 3 0 0 1-3 3h-3",
};

export async function Guarantees() {
  const t = (await getContent()).blocks.guarantees;
  return (
    <Room id="guarantees" room="guarantees" index="09" title={t.title} lead={t.lead}>
      <ul className={s.grid}>
        {t.items.map((item, i) => (
          <li key={i} className={s.card} data-reveal data-press>
            <svg className={s.icon} viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d={icons[item.icon]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className={s.title}>{item.title}</h3>
            <p className={s.text}>{item.text}</p>
          </li>
        ))}
      </ul>

      <div data-reveal>
        <a href="#contact" data-lead="new" className="btn btn--primary">
          {t.cta}
        </a>
      </div>
    </Room>
  );
}
