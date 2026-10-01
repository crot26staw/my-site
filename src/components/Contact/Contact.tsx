import { getContent } from "@/lib/server/content";
import { Room } from "../Room/Room";
import { LeadForm } from "./LeadForm";
import s from "./Contact.module.css";

export async function Contact() {
  const t = (await getContent()).blocks.contact;
  return (
    <Room id="contact" room="contact" index="11" hideFab title={t.title} lead={t.lead}>
      <div className={s.columns}>
        <div className={s.column} data-reveal>
          <h3 className={s.title}>{t.newTitle}</h3>
          <p className={s.text}>{t.newText}</p>
          <LeadForm variant="new" submitLabel={t.newSubmit} />
        </div>
        <div className={`${s.column} ${s.audit}`} data-reveal>
          <h3 className={s.title}>{t.auditTitle}</h3>
          <p className={s.text}>{t.auditText}</p>
          <LeadForm variant="audit" submitLabel={t.auditSubmit} />
        </div>
      </div>

      <p className={s.fine}>{t.fine}</p>
    </Room>
  );
}
