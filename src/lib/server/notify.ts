import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Уведомления о новой заявке: сначала письмо на почту из контактов сайта, затем сообщение в Telegram.
 * Оба канала необязательны и независимы: почта — SMTP_* в .env, Telegram — TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
 * Сбой одного канала не отменяет другой.
 */

const SOURCES: Record<string, string> = { quiz: "Квиз", "form-new": "Заявка на сайт", "form-audit": "Заявка на аудит" };
const CHANNELS: Record<string, string> = { telegram: "Telegram", whatsapp: "WhatsApp", call: "звонок", email: "e-mail" };

/** Простая проверка адреса: в контактах может стоять плейсхолдер вроде «[почта]». */
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;

export interface LeadNotice {
  id: string;
  source: string;
  name: string | null;
  contact: string;
  channel: string;
  url: string | null;
  task: string | null;
  answers: Record<string, string[]> | null;
  priceMin: number | null;
  priceMax: number | null;
}

export async function notifyLead(lead: LeadNotice, mailTo: string): Promise<void> {
  try {
    await sendEmail(lead, mailTo);
  } catch (err) {
    console.error("[leads] письмо не отправлено:", (err as Error).message);
  }
  try {
    await sendTelegram(lead);
  } catch (err) {
    console.error("[leads] уведомление в Telegram не отправлено:", (err as Error).message);
  }
}

function title(lead: LeadNotice): string {
  return `Новая заявка №${lead.id}: ${SOURCES[lead.source] ?? lead.source}`;
}

function summary(lead: LeadNotice, taskLimit: number): string[] {
  return [
    lead.name && `Имя: ${lead.name}`,
    `Контакт: ${lead.contact} (${CHANNELS[lead.channel] ?? lead.channel})`,
    lead.url && `Сайт: ${lead.url}`,
    lead.task && `Задача: ${lead.task.slice(0, taskLimit)}`,
    lead.priceMin !== null && `Расчёт: ${lead.priceMin.toLocaleString("ru-RU")}–${lead.priceMax?.toLocaleString("ru-RU")} ₽`,
  ].filter((line): line is string => Boolean(line));
}

let transport: Transporter | null = null;

function getTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transport = nodemailer.createTransport({
      host,
      port,
      // 465 — сразу TLS, 587/25 — STARTTLS
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transport;
}

async function sendEmail(lead: LeadNotice, to: string): Promise<void> {
  const smtp = getTransport();
  if (!smtp) return;
  if (!EMAIL_RE.test(to)) throw new Error(`в контактах сайта не указана почта (сейчас «${to}»)`);

  const lines = summary(lead, 5000);
  if (lead.answers) {
    lines.push("", "Ответы квиза:");
    for (const [question, picked] of Object.entries(lead.answers)) lines.push(`${question}: ${picked.join(", ") || "—"}`);
  }

  await smtp.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    // Ответ на письмо уйдёт клиенту, если он оставил почту
    replyTo: lead.channel === "email" && EMAIL_RE.test(lead.contact) ? lead.contact : undefined,
    subject: title(lead),
    // Только текст: данные из формы не попадают в HTML
    text: lines.join("\n"),
  });
}

async function sendTelegram(lead: LeadNotice): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  if (!/^\d+:[\w-]{30,}$/.test(token)) throw new Error("TELEGRAM_BOT_TOKEN в неверном формате");

  // Обычный текст без parse_mode: данные из формы не интерпретируются как разметка
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: [title(lead), ...summary(lead, 500)].join("\n"), disable_web_page_preview: true }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Telegram ответил ${res.status}`);
}
