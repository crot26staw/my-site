import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp, { type Metadata, type Sharp } from "sharp";
import type { ImagePreset } from "@/content/schema";
import { query } from "./db";

/**
 * Загрузка картинок из админки. Файл не сохраняется как есть: sharp читает его как картинку
 * (не картинка — отказ) и перекодирует заново. Так пропадают метаданные (EXIF, GPS) и всё,
 * что могло быть спрятано в файле, а имя — случайное: путь не подобрать и не перезаписать чужой файл.
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_PIXELS = 60_000_000;
const ALLOWED_INPUT = new Set(["jpeg", "png", "webp", "avif", "gif"]);

sharp.cache(false);
sharp.concurrency(1);

// turbopackIgnore: папка загрузок — данные сервера, а не часть сборки; без пометки сборщик тянул бы в сборку весь проект
export function uploadsDir(): string {
  return resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || join(/*turbopackIgnore: true*/ process.cwd(), "storage/uploads"));
}

interface Output {
  path: string;
  width: number;
  height: number;
}

export class UploadError extends Error {}

export async function processUpload(input: Buffer, preset: ImagePreset, userId: number): Promise<Output> {
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new UploadError("Это не картинка или файл повреждён");
  }
  if (!meta.format || !ALLOWED_INPUT.has(meta.format)) throw new UploadError("Подходят JPG, PNG, WebP, AVIF или GIF");

  // rotate() — по EXIF, чтобы фото с телефона не легло на бок; метаданные sharp по умолчанию не переносит
  const image = sharp(input, { limitInputPixels: MAX_PIXELS, animated: false }).rotate();
  let ext: "webp" | "jpg";
  let pipeline: Sharp;
  switch (preset) {
    case "preview":
      // Квадрат 600×600 для карточек кейсов: скриншоты обрезаем сверху — там первый экран сайта
      pipeline = image.resize(600, 600, { fit: "cover", position: "top" }).webp({ quality: 80 });
      ext = "webp";
      break;
    case "photo":
      pipeline = image.resize(600, 600, { fit: "cover", position: "attention" }).webp({ quality: 82 });
      ext = "webp";
      break;
    case "screenshot":
      // Длинный скриншот: JPG сжимает такие картинки лучше WebP и не упирается в его лимит 16383 px по высоте
      pipeline = image.resize({ width: 1800, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true });
      ext = "jpg";
      break;
    case "picture":
      pipeline = image.resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 });
      ext = "webp";
      break;
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const month = new Date().toISOString().slice(0, 7);
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  const dir = join(/*turbopackIgnore: true*/ uploadsDir(), preset, month);
  await mkdir(dir, { recursive: true });
  // wx — не перезаписывать существующий файл
  await writeFile(join(/*turbopackIgnore: true*/ dir, name), data, { flag: "wx", mode: 0o644 });
  const path = `/uploads/${preset}/${month}/${name}`;
  await query("INSERT INTO uploads (path, preset, mime, width, height, size, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
    path,
    preset,
    ext === "jpg" ? "image/jpeg" : "image/webp",
    info.width,
    info.height,
    data.length,
    userId,
  ]);
  return { path, width: info.width, height: info.height };
}
