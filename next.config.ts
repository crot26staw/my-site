import type { NextConfig } from "next";

/**
 * Статический экспорт (папка out/) — для GitHub Pages.
 * Сайт на Pages живёт в подпапке https://<user>.github.io/<repo>/, её передаёт
 * workflow через PAGES_BASE_PATH. Локально переменной нет — сайт в корне.
 */
const basePath = process.env.PAGES_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  // Для путей к файлам из public/ в <img> (src/lib/asset.ts) — Next сам их не дополняет
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? "" },
  images: { unoptimized: true },
};

export default nextConfig;
