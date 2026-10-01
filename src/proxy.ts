import { NextResponse, type NextRequest } from "next/server";
import { PANEL_PATH } from "@/lib/paths";
import { SESSION_COOKIE } from "@/lib/server/sessionCookie";

/**
 * Перед каждой страницей:
 * 1. Content-Security-Policy с одноразовым nonce: браузер выполнит только скрипты Next и наш инлайн-скрипт,
 *    внедрённый через XSS скрипт не запустится. Next сам проставляет nonce своим скриптам.
 * 2. Админка: без cookie сессии — сразу на вход. Это только быстрый фильтр: настоящая проверка сессии
 *    в базе — в каждой странице и каждом действии админки (src/lib/server/auth.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPanel = pathname === PANEL_PATH || pathname.startsWith(`${PANEL_PATH}/`);

  if (isPanel && pathname !== `${PANEL_PATH}/login` && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = `${PANEL_PATH}/login`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    // 'strict-dynamic': скрипты, которые загрузил доверенный скрипт, тоже доверенные (чанки Next)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Инлайн-стили: style={{...}} в компонентах (цвета комнат, прогресс квиза)
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Статика, картинки и загрузки — без CSP и без проверок; API админки проверяет сессию сам
      source: "/((?!_next/static|_next/image|images|uploads|icon.svg|og.png|web-lite-panel/api).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
