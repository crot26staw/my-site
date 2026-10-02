"use server";

import { after } from "next/server";
import { quizQuestions, quizRange, type QuizAnswers } from "@/config/quiz";
import type { QuizQuestionId } from "@/content/types";
import { LIMITS, sanitize } from "@/lib/textGuard";
import { plansOf } from "@/lib/format";
import { channels, validateContact, validateName, validateTask, validateUrl, type LeadInput, type LeadResult } from "@/lib/leads";
import { getContent } from "@/lib/server/content";
import { query, queryOne } from "@/lib/server/db";
import { notifyLead } from "@/lib/server/notify";
import { clientIpHash, userAgent } from "@/lib/server/request";

/** Быстрее человек форму не заполнит. */
const MIN_FILL_MS = 2500;
/** Лимиты заявок с одного IP. */
const LIMITS_PER_IP = [
  { windowMinutes: 10, max: 3 },
  { windowMinutes: 24 * 60, max: 10 },
];
/** Лимит на все заявки сразу — на случай атаки с множества адресов. */
const GLOBAL_PER_HOUR = 200;

const CHANNELS = new Set(channels.map((c) => c.value));
const SOURCES = new Set(["quiz", "form-new", "form-audit"]);
const PLACES = new Set(["contact", "modal"]);

const fail = (error: string): LeadResult => ({ ok: false, error });

/**
 * Приём заявки с формы или квиза. Всё, что проверял браузер, проверяем заново: браузерную проверку обходят за минуту.
 * Server Action: Next сам сверяет Origin запроса с адресом сайта (защита от CSRF).
 */
export async function submitLead(raw: LeadInput): Promise<LeadResult> {
  if (!raw || typeof raw !== "object" || !SOURCES.has(raw.source)) return fail("Некорректная заявка");

  // Бот заполнил ловушку — отвечаем «успехом», чтобы он не подбирал обход, и ничего не сохраняем
  if (typeof raw.website === "string" && raw.website.trim()) return { ok: true };
  if (typeof raw.elapsedMs !== "number" || raw.elapsedMs < MIN_FILL_MS) return fail("Слишком быстро. Проверьте данные и отправьте ещё раз.");

  const channel = typeof raw.channel === "string" && CHANNELS.has(raw.channel) ? raw.channel : undefined;
  if (!channel) return fail("Выберите удобный способ связи");
  const contact = sanitize(String(raw.contact ?? ""), LIMITS.contact);
  const contactError = validateContact(raw.source === "quiz" ? channel : undefined, contact);
  if (contactError) return fail(contactError);

  const lead: {
    source: LeadInput["source"];
    place: string | null;
    name: string | null;
    url: string | null;
    task: string | null;
    answers: Record<string, string[]> | null;
    priceMin: number | null;
    priceMax: number | null;
  } = { source: raw.source, place: null, name: null, url: null, task: null, answers: null, priceMin: null, priceMax: null };

  if (raw.source === "quiz") {
    const content = await getContent();
    const questions = quizQuestions(content.quiz);
    // Только известные вопросы и варианты: подменённые в DOM ответы отбрасываются
    const answers: QuizAnswers = {};
    const readable: Record<string, string[]> = {};
    const input = raw.answers && typeof raw.answers === "object" ? raw.answers : {};
    for (const q of questions) {
      const values = Array.isArray(input[q.id]) ? (input[q.id] as unknown[]).filter((v): v is string => typeof v === "string") : [];
      const valid = q.options.filter((o) => values.includes(o.value));
      const picked = q.multiple ? valid : valid.slice(0, 1);
      answers[q.id as QuizQuestionId] = picked.map((o) => o.value);
      readable[q.title] = picked.map((o) => o.label);
    }
    if (!answers.type?.length) return fail("Ответьте на вопросы теста");
    const range = quizRange(answers, questions, content.quiz.pricing, plansOf(content.siteTypes));
    lead.answers = readable;
    lead.priceMin = range?.min ?? null;
    lead.priceMax = range?.max ?? null;
  } else {
    const name = sanitize(String(raw.name ?? ""), LIMITS.name);
    const nameError = validateName(name);
    if (nameError) return fail(nameError);
    lead.name = name;
    lead.place = PLACES.has(raw.place) ? raw.place : null;
    if (raw.source === "form-audit") {
      const url = sanitize(String(raw.url ?? ""), LIMITS.url);
      const urlError = validateUrl(url);
      if (urlError) return fail(urlError);
      lead.url = url;
    } else {
      const task = sanitize(String(raw.task ?? ""), LIMITS.task, true);
      const taskError = validateTask(task);
      if (taskError) return fail(taskError);
      lead.task = task || null;
    }
  }

  const ipHash = await clientIpHash();
  for (const limit of LIMITS_PER_IP) {
    const row = await queryOne<{ n: number }>(
      "SELECT count(*)::int AS n FROM leads WHERE ip_hash = $1 AND created_at > now() - make_interval(mins => $2)",
      [ipHash, limit.windowMinutes],
    );
    if ((row?.n ?? 0) >= limit.max) return fail("Слишком много заявок подряд. Попробуйте позже или напишите нам в мессенджер.");
  }
  const total = await queryOne<{ n: number }>("SELECT count(*)::int AS n FROM leads WHERE created_at > now() - interval '1 hour'");
  if ((total?.n ?? 0) >= GLOBAL_PER_HOUR) return fail("Не получилось отправить заявку. Попробуйте позже или напишите нам в мессенджер.");

  const [saved] = await query<{ id: string }>(
    `INSERT INTO leads (source, place, name, contact, channel, url, task, answers, price_min, price_max, ip_hash, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
    [
      lead.source,
      lead.place,
      lead.name,
      contact,
      channel,
      lead.url,
      lead.task,
      lead.answers ? JSON.stringify(lead.answers) : null,
      lead.priceMin,
      lead.priceMax,
      ipHash,
      await userAgent(),
    ],
  );

  // Уведомления — после ответа посетителю и не ломают приём заявки: она уже в базе.
  // Сначала письмо на почту из контактов сайта (текущего региона), затем Telegram.
  const mailTo = (await getContent()).site.contacts.email;
  const notice = { id: saved.id, source: lead.source, name: lead.name, contact, channel, url: lead.url, task: lead.task, answers: lead.answers, priceMin: lead.priceMin, priceMax: lead.priceMax };
  after(() => notifyLead(notice, mailTo));
  return { ok: true };
}
