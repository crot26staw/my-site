import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { uploadsDir } from "@/lib/server/uploads";

/**
 * Картинки, загруженные в админке (их нет в public/ на момент сборки, поэтому Next сам их не отдаёт).
 * На сервере быстрее отдавать их nginx-ом напрямую (DEPLOY.md), этот маршрут — запасной путь и для разработки.
 * Путь проверяется строго: только наши папки и имена вида <32 hex>.webp|jpg — выйти за пределы папки нельзя.
 */
const PRESET = /^(preview|photo|screenshot|picture)$/;
const MONTH = /^\d{4}-\d{2}$/;
const FILE = /^[a-f0-9]{32}\.(webp|jpg)$/;

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const parts = (await ctx.params).path;
  if (parts.length !== 3 || !PRESET.test(parts[0]) || !MONTH.test(parts[1]) || !FILE.test(parts[2])) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readFile(join(/*turbopackIgnore: true*/ uploadsDir(), ...parts));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": parts[2].endsWith(".jpg") ? "image/jpeg" : "image/webp",
        // Имя случайное и не меняется: можно кэшировать навсегда
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
