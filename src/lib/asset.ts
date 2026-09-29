/** Путь к файлу из public/ с базовым путём сайта (GitHub Pages живёт в подпапке). */
export const asset = (path: string) => (path.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH}${path}` : path);
