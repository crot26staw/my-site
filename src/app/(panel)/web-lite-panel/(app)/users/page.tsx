import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { CreateUserForm, UserCard } from "./UserForms";

export const metadata: Metadata = { title: "Пользователи" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Moscow" });

export default async function UsersPage() {
  const me = await requireUser("admin");
  const users = await query<{
    id: number;
    login: string;
    name: string;
    role: "admin" | "editor";
    is_active: boolean;
    totp_enabled: boolean;
    last_login_at: Date | null;
  }>("SELECT id, login, name, role, is_active, totp_enabled, last_login_at FROM users ORDER BY id");

  return (
    <>
      <h1>Пользователи</h1>
      <p className="lead-text">
        <strong>Администратор</strong> может всё, включая пользователей и журнал. <strong>Редактор</strong> — тексты, картинки и заявки.
      </p>

      {users.map((u) => (
        <UserCard
          key={u.id}
          user={{
            id: u.id,
            login: u.login,
            name: u.name,
            role: u.role,
            active: u.is_active,
            totp: u.totp_enabled,
            lastLogin: u.last_login_at ? dateFormat.format(u.last_login_at) : null,
          }}
          isMe={u.id === me.id}
        />
      ))}

      <section className="card">
        <h2>Новый пользователь</h2>
        <CreateUserForm />
      </section>
    </>
  );
}
