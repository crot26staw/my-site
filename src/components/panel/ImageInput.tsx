"use client";

import { useRef, useState } from "react";
import type { ImagePreset } from "@/content/schema";
import { PANEL_PATH } from "@/lib/paths";

const HINTS: Record<ImagePreset, string> = {
  preview: "Будет обрезано до квадрата 600×600 (верхняя часть).",
  photo: "Будет обрезано до квадрата 600×600.",
  screenshot: "Ширина уменьшится до 1800 px, высота — любая.",
  picture: "Уменьшится до 1600 px по большей стороне.",
};

type Sized = { src: string; width: number; height: number };

/** Картинка: предпросмотр, загрузка нового файла, удаление. Файл обрабатывается на сервере (src/lib/server/uploads.ts). */
export function ImageInput({
  id,
  preset,
  value,
  withSize,
  optional,
  onChange,
}: {
  id: string;
  preset: ImagePreset;
  value: unknown;
  /** Значение — { src, width, height }, а не просто путь. */
  withSize?: boolean;
  optional?: boolean;
  onChange: (value: unknown) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src = withSize ? ((value as Sized | undefined)?.src ?? "") : typeof value === "string" ? value : "";
  const isPath = src.startsWith("/");

  const upload = async (file: File) => {
    setError(null);
    if (file.size > 15 * 1024 * 1024) {
      setError("Файл больше 15 МБ");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${PANEL_PATH}/api/upload?preset=${preset}`, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream", "X-Requested-With": "web-lite-panel" },
        body: file,
      });
      const body = (await res.json().catch(() => ({}))) as { path?: string; width?: number; height?: number; error?: string };
      if (!res.ok || !body.path) {
        setError(body.error ?? "Не удалось загрузить");
        return;
      }
      onChange(withSize ? { src: body.path, width: body.width, height: body.height } : body.path);
    } catch {
      setError("Нет связи с сервером. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <div className="image-field">
        <div className="image-preview">{isPath ? <img src={src} alt="" /> : <span>{src || "Нет картинки"}</span>}</div>
        <div>
          <div className="actions">
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "Загружаем…" : isPath ? "Заменить" : "Загрузить"}
            </button>
            {src && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Удалить картинку? На сайте она пропадёт после сохранения.")) onChange(withSize ? undefined : "");
                }}
              >
                Удалить
              </button>
            )}
          </div>
          <p className="field-hint">
            JPG, PNG или WebP до 15 МБ. {HINTS[preset]}
            {withSize && isPath && (value as Sized).width ? ` Сейчас: ${(value as Sized).width}×${(value as Sized).height}.` : ""}
          </p>
          {!src && !optional && <p className="field-hint">Без картинки раздел не сохранится — загрузите новую.</p>}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="visually-hidden"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
