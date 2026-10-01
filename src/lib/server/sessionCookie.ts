/**
 * Имя cookie сессии админки. Префикс __Host- (в продакшене) браузер принимает только с Secure, Path=/
 * и без Domain: cookie нельзя подменить с поддомена или по HTTP. Локально по http такой cookie не сохранится,
 * поэтому в dev — без префикса.
 */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-wlp_session" : "wlp_session";
