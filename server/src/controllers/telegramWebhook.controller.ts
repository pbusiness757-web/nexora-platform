import { Request, Response } from "express";
import { sendTelegram } from "../services/telegram.service";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

/** Reply directly to the user who messaged the bot */
async function replyToUser(chatId: number | string, text: string): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // non-fatal
  }
}

export async function handleTelegramWebhook(req: Request, res: Response): Promise<void> {
  // Always respond 200 immediately so Telegram doesn't retry
  res.sendStatus(200);

  const update = req.body;
  const message = update?.message ?? update?.edited_message;
  if (!message) return;

  const chatId   = message.chat?.id;
  const username = message.from?.username ? `@${message.from.username}` : "нет";
  const firstName = message.from?.first_name ?? "";
  const lastName  = message.from?.last_name  ?? "";
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Аноним";
  const text      = message.text ?? "[медиа-файл или стикер]";

  // 1. Forward to admin
  const adminMsg =
    `📩 <b>Входящее сообщение</b>\n` +
    `👤 <b>${fullName}</b> (${username})\n` +
    `🆔 chat_id: <code>${chatId}</code>\n\n` +
    `💬 ${text}\n\n` +
    `↩️ Ответить: <a href="tg://user?id=${chatId}">открыть чат</a>`;
  await sendTelegram(adminMsg);

  // 2. Auto-reply to client
  const autoReply =
    `👋 Привет, ${firstName || ""}!\n\n` +
    `Ваше сообщение получено. Менеджер свяжется с вами в ближайшее время.\n\n` +
    `Если у вас срочный вопрос — опишите его подробнее, мы ответим как можно скорее.\n\n` +
    `🔗 Личный кабинет: https://nexoraexample.pro/cabinet`;
  await replyToUser(chatId, autoReply);
}
