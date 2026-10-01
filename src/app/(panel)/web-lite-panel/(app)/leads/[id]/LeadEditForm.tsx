"use client";

import { useActionState, useState } from "react";
import { updateLeadAction, type LeadFormState } from "@/actions/panel/leads";
import { FormMessage } from "@/components/panel/FormMessage";
import { LEAD_STATUSES } from "../labels";

export function LeadEditForm({ id, status, note }: { id: number; status: string; note: string }) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(updateLeadAction, {});
  // Управляемые поля: React очищает форму после отправки, а значения должны остаться
  const [statusValue, setStatus] = useState(status);
  const [noteValue, setNote] = useState(note);
  return (
    <form action={action}>
      <FormMessage ok={state.ok ? "Сохранено" : undefined} error={state.error} />
      <input type="hidden" name="id" value={id} />
      <div className="field">
        <label className="field-label" htmlFor="status">
          Статус
        </label>
        <select id="status" name="status" className="select" value={statusValue} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: "16rem" }}>
          {Object.entries(LEAD_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="note">
          Заметка <span className="muted">(видна только в админке)</span>
        </label>
        <textarea id="note" name="note" className="textarea" value={noteValue} onChange={(e) => setNote(e.target.value)} maxLength={5000} rows={4} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}
