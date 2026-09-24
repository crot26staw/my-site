import { audit, site } from "@/config/site";
import { Room } from "../Room/Room";
import { LeadForm } from "./LeadForm";
import s from "./Contact.module.css";

export function Contact() {
  return (
    <Room
      id="contact"
      room="contact"
      index="11"
      hideFab
      title="Готовы обсудить ваш сайт?"
      lead={`Выберите, с чего удобнее начать. Ответим в течение ${site.responseMinutes} минут в рабочее время.`}
    >
      <div className={s.columns}>
        <div className={s.column} data-reveal>
          <h3 className={s.title}>Нужен сайт с нуля</h3>
          <p className={s.text}>Расскажите о задаче, и мы предложим решение с точным расчётом стоимости и сроков.</p>
          <LeadForm variant="new" submitLabel="Получить расчёт" />
        </div>
        <div className={`${s.column} ${s.audit}`} data-reveal>
          <h3 className={s.title}>Сайт есть, но не приносит клиентов?</h3>
          <p className={s.text}>
            Пришлите ссылку, и за {audit.hours} часа мы бесплатно найдём {audit.problems} проблем, которые мешают вашему
            сайту продавать, и подскажем, как их исправить.
          </p>
          <LeadForm variant="audit" submitLabel="Получить бесплатный аудит" />
        </div>
      </div>

      <p className={s.fine}>Ни к чему не обязывает. Мы не будем навязывать услуги и звонить без вашего согласия.</p>
    </Room>
  );
}
