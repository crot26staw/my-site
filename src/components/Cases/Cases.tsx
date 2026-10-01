import { getContent } from "@/lib/server/content";
import { PageLink } from "../PageLink";
import { Room } from "../Room/Room";
import { CaseGrid } from "./CaseCard";

export async function Cases() {
  const { cases, blocks, pages } = await getContent();
  const t = blocks.cases;
  return (
    <Room id="cases" room="cases" index="05" title={t.title} lead={t.lead}>
      <CaseGrid items={cases.slice(0, t.homeCount)} labels={pages.cases} />

      <p className="cta-line" data-reveal>
        <span>{t.ctaText}</span>
        <PageLink href="/cases" className="btn btn--outline">
          {t.allButton}
        </PageLink>
        <a href="#contact" data-lead="new" className="btn btn--outline">
          {t.discussButton}
        </a>
      </p>
    </Room>
  );
}
