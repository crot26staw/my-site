import { homeCases } from "@/config/cases";
import { PageLink } from "../PageLink";
import { Room } from "../Room/Room";
import { CaseGrid } from "./CaseCard";

export function Cases() {
  return (
    <Room
      id="cases"
      room="cases"
      index="05"
      title="Наши работы"
      lead="Каждый проект начинается с задачи клиента. Показываем, с чем к нам пришли и что получилось в итоге."
    >
      <CaseGrid items={homeCases} />

      <p className="cta-line" data-reveal>
        <span>Хотите такой же результат? Расскажите о задаче, и мы покажем похожие проекты из вашей ниши.</span>
        <PageLink href="/cases" className="btn btn--outline">
          Все кейсы
        </PageLink>
        <a href="#contact" data-lead="new" className="btn btn--outline">
          Обсудить проект
        </a>
      </p>
    </Room>
  );
}
