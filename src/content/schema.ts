/**
 * Описание полей контента. По нему админка строит формы, а сервер проверяет и чистит данные перед сохранением —
 * одни и те же правила в обоих местах. Модуль без серверных зависимостей: его импортирует и редактор в браузере.
 */

export type TextFormat = "slug" | "url" | "tel" | "email" | "path" | "image";

interface Base {
  label: string;
  hint?: string;
}

export interface TextField extends Base {
  kind: "text";
  multiline?: boolean;
  optional?: boolean;
  max?: number;
  format?: TextFormat;
  placeholder?: string;
}
export interface NumberField extends Base {
  kind: "number";
  min: number;
  max: number;
  step?: number;
  integer?: boolean;
}
export interface BoolField extends Base {
  kind: "bool";
}
export interface SelectField extends Base {
  kind: "select";
  options: { value: string; label: string }[];
  optional?: boolean;
}
/** Идентификатор записи: виден, но не редактируется (тип сайта, вопрос квиза). */
export interface KeyField extends Base {
  kind: "key";
}
export type ImagePreset = "preview" | "screenshot" | "photo" | "picture";
export interface ImageField extends Base {
  kind: "image";
  preset: ImagePreset;
  optional?: boolean;
}
/** Картинка с размерами: { src, width, height } — размеры подставляются при загрузке. */
export interface ScreenshotField extends Base {
  kind: "screenshot";
  optional?: boolean;
}
export interface ListField extends Base {
  kind: "list";
  of: Field;
  min?: number;
  max: number;
  /** Нельзя добавлять и удалять, только менять и переставлять. */
  fixed?: boolean;
  /** Поле элемента, которое показывать в заголовке свёрнутой карточки. */
  titleKey?: string;
  itemLabel?: string;
}
export interface ObjectField extends Partial<Base> {
  kind: "object";
  fields: Record<string, Field>;
  /** Необязательный блок: в форме — переключатель с этой подписью. */
  toggle?: string;
}

export type Field =
  | TextField
  | NumberField
  | BoolField
  | SelectField
  | KeyField
  | ImageField
  | ScreenshotField
  | ListField
  | ObjectField;

/* Конструкторы — чтобы описание разделов читалось как анкета. */

export const text = (label: string, o: Omit<TextField, "kind" | "label"> = {}): TextField => ({ kind: "text", label, ...o });
export const area = (label: string, o: Omit<TextField, "kind" | "label" | "multiline"> = {}): TextField => ({
  kind: "text",
  label,
  multiline: true,
  ...o,
});
export const num = (label: string, o: Omit<NumberField, "kind" | "label">): NumberField => ({ kind: "number", label, ...o });
export const bool = (label: string, o: Omit<BoolField, "kind" | "label"> = {}): BoolField => ({ kind: "bool", label, ...o });
export const select = (label: string, options: SelectField["options"], o: Omit<SelectField, "kind" | "label" | "options"> = {}): SelectField => ({
  kind: "select",
  label,
  options,
  ...o,
});
export const key = (label: string): KeyField => ({ kind: "key", label });
export const image = (label: string, preset: ImagePreset, o: Omit<ImageField, "kind" | "label" | "preset"> = {}): ImageField => ({
  kind: "image",
  label,
  preset,
  ...o,
});
export const screenshot = (label: string, o: Omit<ScreenshotField, "kind" | "label"> = {}): ScreenshotField => ({
  kind: "screenshot",
  label,
  ...o,
});
export const list = (label: string, of: Field, o: Omit<ListField, "kind" | "label" | "of">): ListField => ({ kind: "list", label, of, ...o });
export const obj = (fields: Record<string, Field>, o: Omit<ObjectField, "kind" | "fields"> = {}): ObjectField => ({
  kind: "object",
  fields,
  ...o,
});
/** Список строк: пункты, абзацы, теги. */
export const lines = (label: string, o: { max?: number; min?: number; hint?: string; itemMax?: number; multiline?: boolean } = {}) =>
  list(label, { kind: "text", label: "", max: o.itemMax, multiline: o.multiline }, { max: o.max ?? 30, min: o.min, hint: o.hint });

/* Проверка */

export interface ValidationError {
  path: string;
  message: string;
}

const DEFAULT_MAX = { line: 300, multiline: 5000 };

// Управляющие символы, невидимые пробелы и символы смены направления текста (bidi-спуфинг).
// Неразрывный пробел (U+00A0) и мягкий перенос оставляем — ими пользуются в типографике.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
/** Плейсхолдер в квадратных скобках: «[Телефон]» — данные ещё не заполнены. */
const PLACEHOLDER = /^\[[^\[\]]*\]$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEL = /^tel:\+?\d{5,15}$/;
const EMAIL = /^[\p{L}\d._%+-]{1,64}@(?:[\p{L}\d](?:[\p{L}\d-]{0,61}[\p{L}\d])?\.)+\p{L}{2,24}$/u;
/** Путь страницы сайта: /services, /sites/landing, /#contact. */
const PATH = /^\/[a-z0-9/_-]*(?:#[a-z0-9-]+)?$/;
/** Картинка сайта: из public/images или загруженная в админке. */
export const IMAGE_PATH = /^\/(?:images|uploads)\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:webp|jpe?g|png|svg|gif|avif)$/;

export function isPlaceholder(v: string) {
  return PLACEHOLDER.test(v);
}

function checkFormat(v: string, format: TextFormat): string | null {
  switch (format) {
    case "slug":
      return SLUG.test(v) && v.length <= 60 ? null : "Только строчные латинские буквы, цифры и дефис, например my-project";
    case "url": {
      if (PLACEHOLDER.test(v)) return null;
      if (/[\s<>"'`\\]/.test(v)) return "Ссылка не должна содержать пробелов и кавычек";
      try {
        const u = new URL(v);
        if (u.protocol !== "https:" && u.protocol !== "http:") return "Нужна ссылка вида https://…";
        if (u.username || u.password) return "Ссылка не должна содержать логин и пароль";
        return null;
      } catch {
        return "Нужна ссылка вида https://…";
      }
    }
    case "tel":
      return TEL.test(v) ? null : "Формат: tel:+79991234567 — только цифры после tel:+";
    case "email":
      return PLACEHOLDER.test(v) || (EMAIL.test(v) && !v.includes("..")) ? null : "Проверьте адрес почты";
    case "path":
      return PATH.test(v) && !v.includes("//") ? null : "Адрес страницы сайта, например /services или /sites/landing";
    case "image":
      return PLACEHOLDER.test(v) || (IMAGE_PATH.test(v) && !v.includes("..")) ? null : "Загрузите картинку";
  }
}

function cleanString(v: string, multiline: boolean): string {
  let s = v.normalize("NFC").replace(INVISIBLE, "").replace(/\r\n?/g, "\n");
  s = multiline ? s.replace(/\n{3,}/g, "\n\n") : s.replace(/\n+/g, " ");
  return s.trim();
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Проверяет значение по описанию и возвращает очищенную копию: только известные поля,
 * строки без невидимых символов, пустые необязательные поля — убраны.
 */
export function validate(field: Field, value: unknown, path = "", errors: ValidationError[] = []): { value: unknown; errors: ValidationError[] } {
  const err = (message: string) => errors.push({ path, message });
  switch (field.kind) {
    case "text": {
      if (value === undefined || value === null) value = "";
      if (typeof value !== "string") {
        err("Ожидался текст");
        return { value: undefined, errors };
      }
      const v = cleanString(value, !!field.multiline);
      if (!v) {
        if (!field.optional) err("Заполните поле");
        return { value: undefined, errors };
      }
      const max = field.max ?? (field.multiline ? DEFAULT_MAX.multiline : DEFAULT_MAX.line);
      if (v.length > max) err(`Не больше ${max} символов (сейчас ${v.length})`);
      else if (field.format) {
        const formatError = checkFormat(v, field.format);
        if (formatError) err(formatError);
      }
      return { value: v, errors };
    }
    case "key": {
      if (typeof value !== "string" || !/^[a-z0-9_-]{1,40}$/.test(value)) err("Некорректный идентификатор");
      return { value, errors };
    }
    case "number": {
      const n = typeof value === "string" && value.trim() !== "" ? Number(value.replace(",", ".")) : value;
      if (typeof n !== "number" || !Number.isFinite(n)) {
        err("Введите число");
        return { value: undefined, errors };
      }
      if (field.integer && !Number.isInteger(n)) err("Нужно целое число");
      if (n < field.min || n > field.max) err(`Число от ${field.min} до ${field.max}`);
      return { value: n, errors };
    }
    case "bool":
      return { value: value === true, errors };
    case "select": {
      if ((value === undefined || value === "" || value === null) && field.optional) return { value: undefined, errors };
      if (typeof value !== "string" || !field.options.some((o) => o.value === value)) err("Выберите вариант из списка");
      return { value, errors };
    }
    case "image": {
      if ((value === undefined || value === "" || value === null) && field.optional) return { value: undefined, errors };
      if (typeof value !== "string" || !value) {
        err("Загрузите картинку");
        return { value: undefined, errors };
      }
      const v = cleanString(value, false);
      const formatError = checkFormat(v, "image");
      if (formatError) err(formatError);
      return { value: v, errors };
    }
    case "screenshot": {
      if (field.optional && (!isObject(value) || !value.src)) return { value: undefined, errors };
      if (!isObject(value)) {
        err("Загрузите картинку");
        return { value: undefined, errors };
      }
      const src = typeof value.src === "string" ? value.src : "";
      const width = Number(value.width);
      const height = Number(value.height);
      if (!IMAGE_PATH.test(src) || src.includes("..")) err("Загрузите картинку");
      if (!Number.isInteger(width) || width < 1 || width > 10000 || !Number.isInteger(height) || height < 1 || height > 60000) {
        err("Неизвестный размер картинки — загрузите её заново");
      }
      return { value: { src, width, height }, errors };
    }
    case "list": {
      if (!Array.isArray(value)) {
        err("Ожидался список");
        return { value: [], errors };
      }
      if (value.length > field.max) err(`Не больше ${field.max} элементов`);
      if (field.min && value.length < field.min) err(`Нужно хотя бы ${field.min}`);
      const out = value.slice(0, field.max).map((item, i) => validate(field.of, item, join(path, i), errors).value);
      // Пустые строки в списке строк просто убираем
      return { value: field.of.kind === "text" ? out.filter((v) => v !== undefined) : out, errors };
    }
    case "object": {
      if (!isObject(value)) {
        if (field.toggle) return { value: undefined, errors };
        err("Некорректные данные");
        return { value: {}, errors };
      }
      const out: Record<string, unknown> = {};
      for (const [k, f] of Object.entries(field.fields)) {
        const res = validate(f, value[k], join(path, k), errors).value;
        if (res !== undefined) out[k] = res;
      }
      return { value: out, errors };
    }
  }
}

const join = (path: string, part: string | number) => (path ? `${path}.${part}` : String(part));

/** Значение по умолчанию для нового элемента списка или включённого блока. */
export function emptyValue(field: Field): unknown {
  switch (field.kind) {
    case "text":
    case "key":
    case "image":
      return "";
    case "number":
      return field.min > 0 ? field.min : 0;
    case "bool":
      return false;
    case "select":
      return field.optional ? "" : field.options[0]?.value ?? "";
    case "screenshot":
      return { src: "", width: 0, height: 0 };
    case "list":
      return [];
    case "object":
      return Object.fromEntries(Object.entries(field.fields).map(([k, f]) => [k, emptyValue(f)]));
  }
}

/* Переменные в текстах: «Ответим в течение {срок_ответа} минут» */

export const VARIABLE = /\{([a-zа-яё0-9_]+)\}/gi;

export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(VARIABLE, (match, name: string) => vars[name.toLowerCase()] ?? match);
}

/** Подставляет переменные во все строки вложенных данных. */
export function fillDeep<T>(value: T, vars: Record<string, string>): T {
  if (typeof value === "string") return fill(value, vars) as T;
  if (Array.isArray(value)) return value.map((v) => fillDeep(v, vars)) as T;
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillDeep(v, vars)])) as T;
  return value;
}
