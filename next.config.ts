import type { NextConfig } from "next";

/**
 * Сайт работает как Node-приложение (next start) за nginx: контент и заявки — в PostgreSQL,
 * админка — /web-lite-panel. Content-Security-Policy с nonce ставит src/proxy.ts,
 * остальные заголовки безопасности — здесь (HSTS — в nginx, он знает про HTTPS).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Пути к файлам из public/ в <img> (src/lib/asset.ts); базового пути у сайта на своём сервере нет
  env: { NEXT_PUBLIC_BASE_PATH: "" },
  images: { unoptimized: true },
  // У сайта и админки разные корневые layout — общая страница 404 для неизвестных адресов (app/global-not-found.tsx)
  experimental: { globalNotFound: true },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/web-lite-panel/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
