/**
 * Криптография на секрете приложения APP_SECRET: хеш IP (HMAC) и шифрование секретов 2FA (AES-256-GCM).
 * Без "server-only": модуль нужен и консольным скриптам.
 */

import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

function appSecret(): string {
  const secret = process.env.APP_SECRET ?? "";
  if (secret.length < 32) throw new Error("APP_SECRET не задан или короче 32 символов (см. .env.example)");
  return secret;
}

function subKey(purpose: string): Buffer {
  return Buffer.from(hkdfSync("sha256", appSecret(), "web-lite", purpose, 32));
}

/** IP храним только в виде HMAC: по нему можно считать попытки и заявки, но нельзя узнать сам адрес. */
export function hashIp(ip: string): string {
  return createHmac("sha256", subKey("ip")).update(ip).digest("base64url").slice(0, 32);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", subKey("totp"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decryptSecret(stored: string): string {
  const [version, iv, tag, data] = stored.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Неизвестный формат секрета");
  const decipher = createDecipheriv("aes-256-gcm", subKey("totp"), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
