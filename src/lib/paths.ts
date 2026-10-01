/** Адреса страниц сайта. */

export const casePath = (slug: string) => `/cases/${slug}`;
export const servicePath = (id: string) => `/services/${id}`;
export const siteTypePath = (id: string) => `/sites/${id}`;
export const privacyPath = "/privacy";
export const consentPath = "/consent";
export const PANEL_PATH = "/web-lite-panel";

export const isUrl = (v: string) => /^https?:\/\//.test(v);
/** Картинка, а не плейсхолдер вида «[Фото]». */
export const isImage = (v: string) => /^(\/|https?:)/.test(v);
