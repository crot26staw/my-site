import { fromPrice, plans, type PlanId } from "@/config/site";
import { siteTypePath } from "@/config/siteTypes";
import type { LeadVariant } from "../LeadModal/LeadModal";
import { PageLink } from "../PageLink";
import { Room } from "../Room/Room";
import s from "./ForWhom.module.css";

interface Tile {
  title: string;
  pain: string;
  solution: string;
  price: string;
  /** page — страница типа сайта, иначе якорь href (lead — открыть модалку заявки). */
  link: { label: string; page: PlanId } | { label: string; href: string; lead?: LeadVariant };
}

export function ForWhom() {
  const { landing, corporate, catalog, shop, service } = plans;

  const tiles: Tile[] = [
    {
      title: "Малый бизнес и ИП",
      pain: "Нужно быстро запуститься и начать получать заявки.",
      solution: `Сделаем лендинг или сайт-визитку с продающими текстами и формой заявки. Запуск за ${landing.days} ${landing.daysWord}, без лишних трат.`,
      price: fromPrice(landing.price),
      link: { label: "Подробнее о лендингах", page: "landing" },
    },
    {
      title: "Компании",
      pain: "Сайт устарел, неудобен или сидит на старой CMS.",
      solution:
        "Сделаем редизайн, перенесём сайт на современную платформу без потери позиций в поиске, проведём аудит и исправим то, что мешает продажам.",
      price: fromPrice(corporate.price),
      link: { label: "Подробнее о корпоративных сайтах", page: "corporate" },
    },
    {
      title: "Торговля",
      pain: "Нужно показать товары и продавать онлайн.",
      solution:
        "Сделаем сайт-каталог или интернет-магазин с удобными фильтрами, корзиной и SEO-оптимизацией карточек товаров.",
      price: `Каталог ${fromPrice(catalog.price)} · Магазин ${fromPrice(shop.price)}`,
      link: { label: "Подробнее о магазинах", page: "shop" },
    },
    {
      title: "Стартапы и онлайн-сервисы",
      pain: "Нужен сайт с нестандартной логикой и нишевыми функциями.",
      solution:
        "Разработаем многостраничный сайт под ваш продукт и добавим нужные фичи: личные кабинеты, калькуляторы, интеграции.",
      price: fromPrice(service.price),
      link: { label: "Обсудить проект", href: "#contact", lead: "new" },
    },
  ];

  return (
    <Room
      id="for-whom"
      room="forWhom"
      index="02"
      title="Подберём решение под ваш бизнес"
      lead="Неважно, открываете вы первое дело или обновляете сайт крупной компании. Выберите свою ситуацию, и мы покажем, с чего начать."
    >
      <ul className={s.grid}>
        {tiles.map((tile, i) => (
          <li key={tile.title} className={s.tile} data-reveal data-press data-card-link={"page" in tile.link || undefined}>
            <span className={s.num} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={s.title}>{tile.title}</h3>
            <p className={s.pain}>
              <em>{tile.pain}</em>
            </p>
            <p className={s.solution}>{tile.solution}</p>
            <div className={s.footer}>
              <p className={s.price}>{tile.price}</p>
              {"page" in tile.link ? (
                <PageLink href={siteTypePath(tile.link.page)} className={`card-link ${s.link}`}>
                  {tile.link.label}
                  <span aria-hidden="true">→</span>
                </PageLink>
              ) : (
                <a href={tile.link.href} data-lead={tile.link.lead} className={s.link}>
                  {tile.link.label}
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="cta-line" data-reveal>
        <span>Не нашли свою ситуацию? Опишите задачу, и мы предложим решение в течение часа.</span>
        <a href="#contact" data-lead="new" className="btn btn--outline">
          Написать нам
        </a>
      </p>
    </Room>
  );
}
