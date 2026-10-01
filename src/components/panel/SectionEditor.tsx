"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { restoreRevisionAction, saveSectionAction } from "@/actions/panel/content";
import { emptyValue, type Field, type ListField, type ObjectField, type ValidationError } from "@/content/schema";
import { getSection, VARIABLES } from "@/content/sections";
import { ImageInput } from "./ImageInput";

type Path = (string | number)[];
type Errors = Map<string, string[]>;

const pathKey = (path: Path) => path.join(".");

function setIn(target: unknown, path: Path, value: unknown): unknown {
  if (!path.length) return value;
  const [head, ...rest] = path;
  if (Array.isArray(target)) {
    const copy = target.slice();
    copy[head as number] = setIn(copy[head as number], rest, value);
    return copy;
  }
  const obj = (target && typeof target === "object" ? target : {}) as Record<string, unknown>;
  return { ...obj, [head]: setIn(obj[head as string], rest, value) };
}

export interface RevisionInfo {
  id: number;
  version: number;
  createdAt: string;
  author: string | null;
  note: string | null;
}

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" });

/** Редактор раздела контента: форма по схеме, сохранение, история версий. */
export function SectionEditor({
  sectionKey,
  initialData,
  initialVersion,
  revisions,
}: {
  sectionKey: string;
  initialData: unknown;
  initialVersion: number;
  revisions: RevisionInfo[];
}) {
  const section = getSection(sectionKey)!;
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [version, setVersion] = useState(initialVersion);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const savedJson = useRef(JSON.stringify(initialData));
  const dirty = JSON.stringify(data) !== savedJson.current;

  const errorMap: Errors = useMemo(() => {
    const map: Errors = new Map();
    for (const e of errors) map.set(e.path, [...(map.get(e.path) ?? []), e.message]);
    return map;
  }, [errors]);

  // Несохранённые правки: предупреждаем при закрытии вкладки и при переходе по ссылкам админки
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      if (!window.confirm("Есть несохранённые изменения. Уйти без сохранения?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  // После неудачного сохранения — к первой ошибке
  useEffect(() => {
    if (!errors.length) return;
    const first = document.querySelector<HTMLElement>("[aria-invalid='true'], [data-error-anchor]");
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    first?.focus?.({ preventScroll: true });
  }, [errors]);

  const onChange = (path: Path, value: unknown) => {
    setData((prev: unknown) => setIn(prev, path, value));
    setMessage(null);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveSectionAction(sectionKey, data, version);
      if (result.ok) {
        // Сервер возвращает очищенные данные (без лишних пробелов и пустых строк) — показываем их
        savedJson.current = JSON.stringify(result.data);
        setData(result.data);
        setVersion(result.version);
        setErrors([]);
        setMessage({ type: "success", text: "Сохранено. Изменения уже на сайте." });
        router.refresh();
      } else if (result.conflict) {
        setMessage({
          type: "warning",
          text: "Этот раздел только что сохранил кто-то другой. Чтобы не затереть его правки, обновите страницу и внесите свои изменения заново.",
        });
      } else if (result.errors) {
        setErrors(result.errors);
        setMessage({ type: "error", text: `Не сохранено: исправьте ошибки (${result.errors.length}). Поля с ошибками выделены красным.` });
      } else {
        setMessage({ type: "error", text: result.error ?? "Не удалось сохранить" });
      }
    });

  const restore = (rev: RevisionInfo) => {
    if (dirty && !window.confirm("Несохранённые изменения пропадут. Продолжить?")) return;
    if (!window.confirm(`Вернуть версию ${rev.version} от ${dateFormat.format(new Date(rev.createdAt))}? Текущая версия останется в истории.`)) return;
    startTransition(async () => {
      const result = await restoreRevisionAction(sectionKey, rev.id, version);
      if (result.ok) {
        savedJson.current = JSON.stringify(result.data);
        setData(result.data);
        setVersion(result.version);
        setErrors([]);
        setMessage({ type: "success", text: `Версия ${rev.version} восстановлена и уже на сайте.` });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.conflict ? "Раздел изменили, обновите страницу." : (result.error ?? "Не удалось восстановить") });
      }
    });
  };

  const rootErrors = errorMap.get("") ?? [];

  return (
    <>
      <h1>{section.title}</h1>
      <p className="lead-text">{section.description}</p>

      <details className="vars">
        <summary>Переменные в текстах</summary>
        <p className="small muted" style={{ marginTop: "0.5rem" }}>
          Напишите в любом тексте, например, <code>{"{срок_ответа}"}</code> — на сайте подставится значение из раздела «Контакты и реквизиты»
          или «Типы сайтов и цены». Нажмите на переменную, чтобы скопировать.
        </p>
        <div className="vars-list">
          {VARIABLES.map((v) => (
            <div key={v.name}>
              <code
                role="button"
                tabIndex={0}
                title="Скопировать"
                onClick={() => navigator.clipboard?.writeText(`{${v.name}}`)}
                onKeyDown={(e) => e.key === "Enter" && navigator.clipboard?.writeText(`{${v.name}}`)}
              >{`{${v.name}}`}</code>{" "}
              <span className="muted">— {v.description}</span>
            </div>
          ))}
        </div>
      </details>

      {message && (
        <div className={`notice notice-${message.type}`} role={message.type === "error" ? "alert" : "status"}>
          {message.text}
          {message.type === "warning" && (
            <div style={{ marginTop: "0.5rem" }}>
              <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>
                Обновить страницу
              </button>
            </div>
          )}
        </div>
      )}
      {rootErrors.map((e) => (
        <div key={e} className="notice notice-error" role="alert">
          {e}
        </div>
      ))}

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <FieldEditor field={section.schema} value={data} path={[]} onChange={onChange} errors={errorMap} />

        <div className="savebar" data-dirty={dirty || undefined}>
          <span className={dirty ? "" : "muted"}>{dirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}</span>
          <div className="actions">
            {dirty && (
              <button
                type="button"
                className="btn"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Отменить все несохранённые изменения?")) {
                    setData(JSON.parse(savedJson.current));
                    setErrors([]);
                    setMessage(null);
                  }
                }}
              >
                Отменить изменения
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
              {pending ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </div>
      </form>

      <section className="card">
        <h2>История изменений</h2>
        {revisions.length === 0 ? (
          <p className="muted">Раздел ещё не меняли через админку.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Версия</th>
                  <th>Когда</th>
                  <th>Кто</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {revisions.map((rev) => (
                  <tr key={rev.id}>
                    <td>
                      {rev.version}
                      {rev.note && <div className="small muted">{rev.note}</div>}
                    </td>
                    <td>{dateFormat.format(new Date(rev.createdAt))}</td>
                    <td>{rev.author ?? "—"}</td>
                    <td>
                      {rev.version === version ? (
                        <span className="muted small">текущая</span>
                      ) : (
                        <button type="button" className="btn btn-sm" disabled={pending} onClick={() => restore(rev)}>
                          Вернуть эту версию
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

interface EditorProps<F extends Field = Field> {
  field: F;
  value: unknown;
  path: Path;
  onChange: (path: Path, value: unknown) => void;
  errors: Errors;
  /** Подпись поля не показывать (строка в списке строк). */
  bare?: boolean;
}

const hasErrorsUnder = (errors: Errors, path: Path) => {
  const prefix = pathKey(path);
  for (const key of errors.keys()) if (key === prefix || key.startsWith(`${prefix}.`)) return true;
  return false;
};

function FieldErrors({ errors, path }: { errors: Errors; path: Path }) {
  const list = errors.get(pathKey(path));
  if (!list?.length) return null;
  return (
    <div className="field-error" role="alert" data-error-anchor>
      {list.join(". ")}
    </div>
  );
}

function FieldEditor(props: EditorProps) {
  const { field } = props;
  switch (field.kind) {
    case "object":
      return <ObjectEditor {...props} field={field} />;
    case "list":
      return <ListEditor {...props} field={field} />;
    default:
      return <ScalarEditor {...props} />;
  }
}

function ObjectEditor({ field, value, path, onChange, errors }: EditorProps<ObjectField>) {
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
  const enabled = !field.toggle || !!obj;
  const body = enabled && (
    <>
      {Object.entries(field.fields).map(([key, child]) => (
        <FieldEditor key={key} field={child} value={obj?.[key]} path={[...path, key]} onChange={onChange} errors={errors} />
      ))}
    </>
  );
  const toggle = field.toggle && (
    <label className="checkbox" style={{ marginBottom: enabled ? "1rem" : 0 }}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => {
          if (!e.target.checked && !window.confirm(`Выключить «${field.toggle}»? Заполненные поля этого блока удалятся при сохранении.`)) return;
          onChange(path, e.target.checked ? emptyValue({ ...field, toggle: undefined }) : undefined);
        }}
      />
      {field.toggle}
    </label>
  );
  if (!path.length && !field.label) return <>{body}</>;
  return (
    <fieldset className="group">
      {field.label && <legend>{field.label}</legend>}
      {field.hint && <p className="field-hint" style={{ marginTop: 0 }}>{field.hint}</p>}
      {toggle}
      {body}
      <FieldErrors errors={errors} path={path} />
    </fieldset>
  );
}

function ListEditor({ field, value, path, onChange, errors }: EditorProps<ListField>) {
  const items = Array.isArray(value) ? value : [];
  // Свёрнутые/раскрытые карточки — по индексу; новые раскрываем
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.length <= 2 ? items.map((_, i) => i) : []));
  const isStrings = field.of.kind === "text";

  const update = (next: unknown[]) => onChange(path, next);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
    setOpen((prev) => {
      const s = new Set(prev);
      const a = s.has(i);
      const b = s.has(j);
      s.delete(i);
      s.delete(j);
      if (a) s.add(j);
      if (b) s.add(i);
      return s;
    });
  };
  const remove = (i: number) => {
    const title = itemTitle(i);
    if (!window.confirm(`Удалить «${title}»?`)) return;
    update(items.filter((_, k) => k !== i));
    setOpen((prev) => new Set([...prev].filter((k) => k !== i).map((k) => (k > i ? k - 1 : k))));
  };
  const add = () => {
    update([...items, emptyValue(field.of)]);
    setOpen((prev) => new Set(prev).add(items.length));
  };
  const itemTitle = (i: number) => {
    const item = items[i];
    if (typeof item === "string") return item || `пункт ${i + 1}`;
    const t = field.titleKey && item && typeof item === "object" ? (item as Record<string, unknown>)[field.titleKey] : "";
    return (typeof t === "string" && t) || `${field.itemLabel ?? "элемент"} ${i + 1}`;
  };
  const canAdd = !field.fixed && items.length < field.max;
  const canRemove = !field.fixed;

  return (
    <div className="field">
      {field.label && (
        <div className="field-label">
          {field.label} <span className="counter">{field.fixed ? "" : `${items.length} из ${field.max}`}</span>
        </div>
      )}
      {field.hint && <p className="field-hint" style={{ marginTop: 0 }}>{field.hint}</p>}
      <FieldErrors errors={errors} path={path} />

      {isStrings
        ? items.map((item, i) => (
            <div key={i} className="string-row">
              <ScalarEditor field={field.of} value={item} path={[...path, i]} onChange={onChange} errors={errors} bare />
              <ItemButtons i={i} count={items.length} onMove={move} onRemove={canRemove ? remove : undefined} />
            </div>
          ))
        : items.map((item, i) => {
            const itemPath = [...path, i];
            const withError = hasErrorsUnder(errors, itemPath);
            const isOpen = open.has(i) || withError;
            return (
              <div key={i} className="list-item" data-open={isOpen || undefined} data-error={withError || undefined}>
                <div className="list-item-head">
                  <button
                    type="button"
                    className="list-item-title"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpen((prev) => {
                        const s = new Set(prev);
                        if (s.has(i)) s.delete(i);
                        else s.add(i);
                        return s;
                      })
                    }
                  >
                    {itemTitle(i)}
                  </button>
                  <ItemButtons i={i} count={items.length} onMove={move} onRemove={canRemove ? remove : undefined} />
                </div>
                {isOpen && (
                  <div className="list-item-body">
                    <FieldEditor field={field.of} value={item} path={itemPath} onChange={onChange} errors={errors} />
                  </div>
                )}
              </div>
            );
          })}

      {canAdd && (
        <button type="button" className="btn btn-sm" onClick={add}>
          + Добавить {field.itemLabel ?? "пункт"}
        </button>
      )}
    </div>
  );
}

function ItemButtons({
  i,
  count,
  onMove,
  onRemove,
}: {
  i: number;
  count: number;
  onMove: (i: number, dir: -1 | 1) => void;
  onRemove?: (i: number) => void;
}) {
  return (
    <div className="actions" style={{ flexWrap: "nowrap" }}>
      <button type="button" className="btn btn-sm btn-icon" disabled={i === 0} onClick={() => onMove(i, -1)} aria-label="Выше" title="Выше">
        ↑
      </button>
      <button type="button" className="btn btn-sm btn-icon" disabled={i === count - 1} onClick={() => onMove(i, 1)} aria-label="Ниже" title="Ниже">
        ↓
      </button>
      {onRemove && (
        <button type="button" className="btn btn-sm btn-icon btn-danger" onClick={() => onRemove(i)} aria-label="Удалить" title="Удалить">
          ✕
        </button>
      )}
    </div>
  );
}

function ScalarEditor({ field, value, path, onChange, errors, bare }: EditorProps) {
  const id = `f-${pathKey(path) || "root"}`;
  const fieldErrors = errors.get(pathKey(path));
  const invalid = fieldErrors?.length ? true : undefined;
  const hintId = `${id}-hint`;

  let control: React.ReactNode;
  switch (field.kind) {
    case "text": {
      const v = typeof value === "string" ? value : "";
      const common = {
        id,
        value: v,
        "aria-invalid": invalid,
        "aria-describedby": field.hint ? hintId : undefined,
        placeholder: field.placeholder,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(path, e.target.value),
      };
      control = field.multiline ? (
        <textarea className="textarea" rows={Math.min(10, Math.max(3, Math.ceil(v.length / 90)))} {...common} />
      ) : (
        <input className="input" type="text" spellCheck={field.format ? false : undefined} {...common} />
      );
      if (!bare && field.max) {
        return (
          <div className="field">
            <label className="field-label" htmlFor={id}>
              {field.label}
              {field.optional && <span className="muted"> (необязательно)</span>}
              <span className="counter" data-over={v.length > field.max || undefined}>
                {v.length} / {field.max}
              </span>
            </label>
            {control}
            {field.hint && (
              <p className="field-hint" id={hintId}>
                {field.hint}
              </p>
            )}
            <FieldErrors errors={errors} path={path} />
          </div>
        );
      }
      break;
    }
    case "number":
      control = (
        <input
          id={id}
          className="input"
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.step ?? (field.integer ? 1 : "any")}
          value={typeof value === "number" || typeof value === "string" ? value : ""}
          aria-invalid={invalid}
          onChange={(e) => onChange(path, e.target.value === "" ? "" : Number(e.target.value))}
          style={{ maxWidth: "14rem" }}
        />
      );
      break;
    case "bool":
      return (
        <div className="field">
          <label className="checkbox">
            <input type="checkbox" checked={value === true} onChange={(e) => onChange(path, e.target.checked)} />
            {field.label}
          </label>
          {field.hint && <p className="field-hint">{field.hint}</p>}
        </div>
      );
    case "select":
      control = (
        <select id={id} className="select" value={typeof value === "string" ? value : ""} aria-invalid={invalid} onChange={(e) => onChange(path, e.target.value)}>
          {field.optional && <option value="">— не выбрано —</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "key":
      control = <input id={id} className="input" value={String(value ?? "")} readOnly style={{ maxWidth: "14rem" }} />;
      break;
    case "image":
    case "screenshot":
      control = (
        <ImageInput
          id={id}
          preset={field.kind === "screenshot" ? "screenshot" : field.preset}
          value={value}
          withSize={field.kind === "screenshot"}
          optional={field.optional}
          onChange={(v) => onChange(path, v)}
        />
      );
      break;
    default:
      return null;
  }

  if (bare) {
    return (
      <div style={{ flex: 1 }}>
        {control}
        <FieldErrors errors={errors} path={path} />
      </div>
    );
  }
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {field.label}
        {"optional" in field && field.optional && <span className="muted"> (необязательно)</span>}
      </label>
      {control}
      {field.hint && (
        <p className="field-hint" id={hintId}>
          {field.hint}
        </p>
      )}
      <FieldErrors errors={errors} path={path} />
    </div>
  );
}
