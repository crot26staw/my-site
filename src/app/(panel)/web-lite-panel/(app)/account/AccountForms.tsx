"use client";

import { useActionState, useState, useTransition } from "react";
import {
  changePasswordAction,
  confirmTwoFactorAction,
  disableTwoFactorAction,
  endOtherSessionsAction,
  startTwoFactorAction,
  type AccountState,
  type TotpSetup,
} from "@/actions/panel/account";
import { FormMessage } from "@/components/panel/FormMessage";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePasswordAction, {});
  return (
    <form action={action} style={{ maxWidth: "28rem" }}>
      <FormMessage ok={state.ok} error={state.error} />
      <div className="field">
        <label className="field-label" htmlFor="current">
          Текущий пароль
        </label>
        <input id="current" name="current" type="password" className="input" autoComplete="current-password" required maxLength={256} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="password">
          Новый пароль
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" required minLength={10} maxLength={128} />
        <p className="field-hint">Не короче 10 символов. Лучше — фраза из нескольких слов.</p>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="repeat">
          Новый пароль ещё раз
        </label>
        <input id="repeat" name="repeat" type="password" className="input" autoComplete="new-password" required maxLength={128} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        Сменить пароль
      </button>
    </form>
  );
}

export function TwoFactorBlock({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [confirm, confirmAction, confirming] = useActionState<AccountState, FormData>(confirmTwoFactorAction, {});
  const [disable, disableAction, disabling] = useActionState<AccountState, FormData>(disableTwoFactorAction, {});

  if (enabled) {
    return (
      <>
        <div className="notice notice-success">{confirm.ok ?? "Включена."}</div>
        <form action={disableAction} style={{ maxWidth: "28rem" }}>
          <FormMessage ok={disable.ok} error={disable.error} />
          <div className="field">
            <label className="field-label" htmlFor="disable-password">
              Чтобы отключить, введите пароль
            </label>
            <input id="disable-password" name="password" type="password" className="input" autoComplete="current-password" required maxLength={256} />
          </div>
          <button type="submit" className="btn btn-danger" disabled={disabling}>
            Отключить
          </button>
        </form>
      </>
    );
  }

  if (!setup) {
    return (
      <>
        <FormMessage ok={disable.ok} error={startError ?? undefined} />
        <button
          type="button"
          className="btn btn-primary"
          disabled={starting}
          onClick={() =>
            startTransition(async () => {
              const result = await startTwoFactorAction();
              if ("error" in result) setStartError(result.error);
              else setSetup(result);
            })
          }
        >
          Включить
        </button>
      </>
    );
  }

  return (
    <div>
      <ol>
        <li>Установите на телефон приложение: Google Authenticator, Яндекс Ключ, Microsoft Authenticator или 1Password.</li>
        <li>Отсканируйте QR-код (в приложении — «Добавить аккаунт»).</li>
        <li>Введите 6 цифр, которые покажет приложение.</li>
      </ol>
      {/* SVG собран на сервере библиотекой qrcode из нашей же ссылки otpauth:// — внешних данных в нём нет */}
      <div className="qr" dangerouslySetInnerHTML={{ __html: setup.qrSvg }} />
      <p className="small muted" style={{ marginTop: "0.5rem" }}>
        Не сканируется? Введите ключ вручную: <code style={{ userSelect: "all" }}>{setup.secret}</code>
      </p>
      <form action={confirmAction} style={{ maxWidth: "20rem" }}>
        <FormMessage error={confirm.error} />
        <div className="field">
          <label className="field-label" htmlFor="totp-code">
            Код из приложения
          </label>
          <input id="totp-code" name="code" className="input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={confirming}>
          Подтвердить и включить
        </button>
      </form>
    </div>
  );
}

export function SessionsBlock() {
  const [state, setState] = useState<AccountState>({});
  const [pending, startTransition] = useTransition();
  return (
    <>
      <FormMessage ok={state.ok} error={state.error} />
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (window.confirm("Выйти на всех остальных устройствах?")) setState(await endOtherSessionsAction());
          })
        }
      >
        Выйти на всех остальных устройствах
      </button>
    </>
  );
}
