"use client";

import { useActionState, useState } from "react";
import {
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  resetUserTwoFactorAction,
  updateUserAction,
  type UserFormState,
} from "@/actions/panel/users";
import { ConfirmButton } from "@/components/panel/ConfirmButton";
import { FormMessage } from "@/components/panel/FormMessage";

interface UserView {
  id: number;
  login: string;
  name: string;
  role: "admin" | "editor";
  active: boolean;
  totp: boolean;
  lastLogin: string | null;
}

/** Случайный пароль из 16 символов без похожих букв (l/1, O/0). */
function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function PasswordInput({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState("");
  return (
    <div className="actions" style={{ flexWrap: "nowrap" }}>
      <input
        id={id}
        name={name}
        className="input"
        type="text"
        autoComplete="new-password"
        spellCheck={false}
        minLength={10}
        maxLength={128}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="button" className="btn btn-sm" onClick={() => setValue(generatePassword())}>
        Придумать
      </button>
    </div>
  );
}

export function CreateUserForm() {
  const [state, action, pending] = useActionState<UserFormState, FormData>(createUserAction, {});
  return (
    <form action={action}>
      <FormMessage ok={state.ok} error={state.error} />
      <div className="grid">
        <div className="field">
          <label className="field-label" htmlFor="new-login">
            Логин
          </label>
          <input id="new-login" name="login" className="input" required pattern="[a-z0-9._\-]{3,32}" autoCapitalize="none" spellCheck={false} />
          <p className="field-hint">Латиница, цифры, точка, дефис</p>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="new-name">
            Имя
          </label>
          <input id="new-name" name="name" className="input" maxLength={80} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="new-role">
            Роль
          </label>
          <select id="new-role" name="role" className="select" defaultValue="editor">
            <option value="editor">Редактор</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="new-password">
            Пароль
          </label>
          <PasswordInput id="new-password" name="password" />
          <p className="field-hint">Не короче 10 символов. Передайте лично, не по почте.</p>
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        Создать пользователя
      </button>
    </form>
  );
}

export function UserCard({ user, isMe }: { user: UserView; isMe: boolean }) {
  const [update, updateAction, updating] = useActionState<UserFormState, FormData>(updateUserAction, {});
  const [reset, resetAction, resetting] = useActionState<UserFormState, FormData>(resetUserPasswordAction, {});
  const [twoFa, twoFaAction, twoFaPending] = useActionState<UserFormState, FormData>(resetUserTwoFactorAction, {});
  const [del, delAction, deleting] = useActionState<UserFormState, FormData>(deleteUserAction, {});
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);

  return (
    <section className="card">
      <h2>
        {user.name} <span className="muted small">({user.login})</span> {isMe && <span className="status status-new">это вы</span>}{" "}
        {!user.active && <span className="status status-spam">отключён</span>}
      </h2>
      <p className="muted small">
        Последний вход: {user.lastLogin ?? "ещё не входил"} · Двухфакторная авторизация: {user.totp ? "включена" : "нет"}
      </p>

      <form action={updateAction}>
        <FormMessage ok={update.ok} error={update.error} />
        <input type="hidden" name="id" value={user.id} />
        <div className="grid">
          <div className="field">
            <label className="field-label" htmlFor={`name-${user.id}`}>
              Имя
            </label>
            <input id={`name-${user.id}`} name="name" className="input" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`role-${user.id}`}>
              Роль
            </label>
            <select id={`role-${user.id}`} name="role" className="select" value={role} onChange={(e) => setRole(e.target.value as UserView["role"])}>
              <option value="editor">Редактор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div className="field" style={{ alignSelf: "end" }}>
            <label className="checkbox">
              <input type="checkbox" name="active" checked={active} onChange={(e) => setActive(e.target.checked)} disabled={isMe} />
              Доступ включён
            </label>
            {/* Отключённый чекбокс не отправляется — себя отключить нельзя */}
            {isMe && <input type="hidden" name="active" value="on" />}
          </div>
        </div>
        <button type="submit" className="btn" disabled={updating}>
          Сохранить
        </button>
      </form>

      <details style={{ marginTop: "1rem" }}>
        <summary className="btn btn-sm">Сменить пароль</summary>
        <form action={resetAction} style={{ marginTop: "0.75rem", maxWidth: "28rem" }}>
          <FormMessage ok={reset.ok} error={reset.error} />
          <input type="hidden" name="id" value={user.id} />
          <div className="field">
            <label className="field-label" htmlFor={`pw-${user.id}`}>
              Новый пароль
            </label>
            <PasswordInput id={`pw-${user.id}`} name="password" />
            <p className="field-hint">Все сессии пользователя завершатся.</p>
          </div>
          <button type="submit" className="btn" disabled={resetting}>
            Задать пароль
          </button>
        </form>
      </details>

      <div className="actions" style={{ marginTop: "1rem" }}>
        {user.totp && (
          <form action={twoFaAction}>
            <input type="hidden" name="id" value={user.id} />
            <ConfirmButton message={`Отключить двухфакторную авторизацию у ${user.login}? Например, если он потерял телефон.`} className="btn btn-sm" disabled={twoFaPending}>
              Сбросить 2FA
            </ConfirmButton>
          </form>
        )}
        {!isMe && (
          <form action={delAction}>
            <input type="hidden" name="id" value={user.id} />
            <ConfirmButton message={`Удалить пользователя ${user.login}? Его правки в истории останутся без автора.`} className="btn btn-sm btn-danger" disabled={deleting}>
              Удалить пользователя
            </ConfirmButton>
          </form>
        )}
      </div>
      <FormMessage ok={twoFa.ok ?? del.ok} error={twoFa.error ?? del.error} />
    </section>
  );
}
