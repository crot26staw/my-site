import { logoutAction } from "@/actions/panel/auth";
import { Sidebar, type NavGroup } from "@/components/panel/Sidebar";
import { GROUPS, SECTIONS } from "@/content/sections";
import { PANEL_PATH } from "@/lib/paths";
import { requireUser } from "@/lib/server/auth";
import { queryOne } from "@/lib/server/db";

/** Каркас админки для вошедших: меню слева, имя и выход сверху. Проверка входа — здесь и в каждой странице и действии. */
export default async function PanelAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const newLeads = (await queryOne<{ n: number }>("SELECT count(*)::int AS n FROM leads WHERE status = 'new'"))?.n ?? 0;

  const groups: NavGroup[] = [
    {
      title: "",
      links: [
        { href: PANEL_PATH, label: "Обзор" },
        { href: `${PANEL_PATH}/leads`, label: "Заявки", badge: newLeads || undefined },
      ],
    },
    ...GROUPS.map((g) => ({
      title: g.title,
      links: SECTIONS.filter((s) => s.group === g.id).map((s) => ({ href: `${PANEL_PATH}/content/${s.key}`, label: s.title })),
    })),
    {
      title: "Доступ",
      links: [
        { href: `${PANEL_PATH}/account`, label: "Мой профиль" },
        ...(user.role === "admin"
          ? [
              { href: `${PANEL_PATH}/users`, label: "Пользователи" },
              { href: `${PANEL_PATH}/journal`, label: "Журнал действий" },
            ]
          : []),
      ],
    },
  ];

  return (
    <div className="shell">
      <Sidebar groups={groups} />
      <div className="main">
        <header className="topbar">
          <div />
          <div className="topbar-user">
            <a href="/" target="_blank" rel="noopener" className="btn btn-sm">
              Открыть сайт ↗
            </a>
            <span className="topbar-name">
              {user.name} · {user.role === "admin" ? "администратор" : "редактор"}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-sm">
                Выйти
              </button>
            </form>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
