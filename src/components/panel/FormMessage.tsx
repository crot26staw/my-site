/** Сообщение формы админки: успех или ошибка. */
export function FormMessage({ ok, error }: { ok?: string; error?: string }) {
  if (error)
    return (
      <div className="notice notice-error" role="alert">
        {error}
      </div>
    );
  if (ok)
    return (
      <div className="notice notice-success" role="status">
        {ok}
      </div>
    );
  return null;
}
