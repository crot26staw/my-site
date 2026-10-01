import "server-only";
import { headers } from "next/headers";
import { hashIp } from "./secrets";

/**
 * Адрес посетителя. За nginx настоящий IP приходит в X-Real-IP (его выставляет nginx, а не браузер),
 * поэтому верим заголовку только при TRUST_PROXY=1 — иначе любой мог бы подставить чужой IP и обойти лимиты.
 */
export async function clientIp(): Promise<string> {
  if (process.env.TRUST_PROXY !== "1") return "direct";
  const h = await headers();
  const ip = h.get("x-real-ip")?.trim();
  return ip && ip.length <= 64 ? ip : "unknown";
}

export async function clientIpHash(): Promise<string> {
  return hashIp(await clientIp());
}

export async function userAgent(): Promise<string> {
  return ((await headers()).get("user-agent") ?? "").slice(0, 300);
}
