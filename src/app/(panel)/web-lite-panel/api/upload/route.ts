import type { NextRequest } from "next/server";
import type { ImagePreset } from "@/content/schema";
import { audit, getCurrentUser } from "@/lib/server/auth";
import { MAX_UPLOAD_BYTES, processUpload, UploadError } from "@/lib/server/uploads";

const PRESETS = new Set<ImagePreset>(["preview", "photo", "screenshot", "picture"]);

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

/**
 * Загрузка картинки: тело запроса — сам файл. Защита от CSRF: Origin должен совпадать с адресом сайта,
 * и нужен заголовок X-Requested-With — его нельзя поставить из чужой формы, а fetch с чужого сайта
 * с таким заголовком браузер без разрешения CORS не отправит.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request) || request.headers.get("x-requested-with") !== "web-lite-panel") {
    return json({ error: "Запрос отклонён" }, 403);
  }
  const user = await getCurrentUser();
  if (!user) return json({ error: "Войдите заново" }, 401);

  const preset = request.nextUrl.searchParams.get("preset") as ImagePreset;
  if (!PRESETS.has(preset)) return json({ error: "Неизвестный тип картинки" }, 400);

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES) return json({ error: "Файл больше 15 МБ" }, 413);
  const body = await readLimited(request, MAX_UPLOAD_BYTES);
  if (!body) return json({ error: "Файл больше 15 МБ" }, 413);
  if (!body.length) return json({ error: "Пустой файл" }, 400);

  try {
    const result = await processUpload(body, preset, user.id);
    await audit(user.id, "upload", result.path);
    return json(result);
  } catch (err) {
    if (err instanceof UploadError) return json({ error: err.message }, 400);
    console.error("[upload]", err);
    return json({ error: "Не удалось обработать картинку" }, 500);
  }
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Читает тело не больше limit байт; null — если больше (Content-Length можно подделать или не прислать). */
async function readLimited(request: NextRequest, limit: number): Promise<Buffer | null> {
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
