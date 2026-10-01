"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/actions/panel/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  // Поля управляемые: после отправки React очищает форму, а при запросе кода логин и пароль вводить заново не нужно
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form action={action}>
      {state.error && (
        <div className="notice notice-error" role="alert">
          {state.error}
        </div>
      )}
      <div className="field">
        <label className="field-label" htmlFor="login">
          Логин
        </label>
        <input
          id="login"
          name="login"
          className="input"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={64}
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoFocus={!state.needCode}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          autoComplete="current-password"
          required
          maxLength={256}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {state.needCode && (
        <div className="field">
          <label className="field-label" htmlFor="code">
            Код из приложения
          </label>
          <input
            id="code"
            name="code"
            className="input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            required
            autoFocus
          />
          <p className="field-hint">6 цифр из приложения-аутентификатора (Google Authenticator, Яндекс Ключ и т.п.).</p>
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Проверяем…" : "Войти"}
      </button>
    </form>
  );
}
