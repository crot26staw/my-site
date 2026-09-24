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
  images: { unoptimized: true },
};

export default nextConfig;
