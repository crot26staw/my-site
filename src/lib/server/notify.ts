import "server-only";

/**
 * Уведомление о новой заявке в Telegram (необязательно): TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.
 * Персональных данных в уведомлении минимум — подробности в админке.
 */

const SOURCES: Record<string, string> = { quiz: "Квиз", "form-new": "Заявка на сайт", "form-audit": "Заявка на аудит" };
const CHANNELS: Record<string, string> = { telegram: "Telegram", whatsapp: "WhatsApp", call: "звонок", email: "e-mail" };

export async function notifyLead(lead: {
  id: string;
  source: string;
  name: string | null;
  contact: string;
  channel: string;
  url: string | null;
  task: string | null;
  priceMin: number | null;
  priceMax: number | null;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  if (!/^\d+:[\w-]{30,}$/.test(token)) throw new Error("TELEGRAM_BOT_TOKEN в неверном формате");

  const lines = [
    `Новая заявка №${lead.id}: ${SOURCES[lead.source] ?? lead.source}`,
    lead.name && `Имя: ${lead.name}`,
    `Контакт: ${lead.contact} (${CHANNELS[lead.channel] ?? lead.channel})`,
    lead.url && `Сайт: ${lead.url}`,
    lead.task && `Задача: ${lead.task.slice(0, 500)}`,
    lead.priceMin !== null && `Расчёт: ${lead.priceMin.toLocaleString("ru-RU")}–${lead.priceMax?.toLocaleString("ru-RU")} ₽`,
  ].filter(Boolean);

  // Обычный текст без parse_mode: данные из формы не интерпретируются как разметка
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), disable_web_page_preview: true }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Telegram ответил ${res.status}`);
}
