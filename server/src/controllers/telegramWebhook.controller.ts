import { Request, Response } from "express";
import { sendTelegram, sendTelegramTo } from "../services/telegram.service";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const SITE_URL       = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexoraexample.pro";

// ─── command handlers ────────────────────────────────────────────────────────

async function handleStart(chatId: number | string, firstName: string): Promise<void> {
  await sendTelegramTo(chatId,
    `👋 Привет, ${firstName || ""}!\n\n` +
    `Я бот поддержки <b>Nexora</b> — платформы для крипто-выплат.\n\n` +
    `<b>Команды:</b>\n` +
    `/status REQ-XXXX — статус вашей заявки\n` +
    `/myid — ваш Telegram chat_id\n` +
    `/help — справка\n\n` +
    `💬 Или просто напишите ваш вопрос — менеджер ответит.`,
  );
}

async function handleHelp(chatId: number | string): Promise<void> {
  await sendTelegramTo(chatId,
    `ℹ️ <b>Справка Nexora Bot</b>\n\n` +
    `/start — приветствие\n` +
    `/status REQ-XXXX — проверить статус заявки\n` +
    `/myid — узнать ваш chat_id для уведомлений\n\n` +
    `🔗 Личный кабинет: ${SITE_URL}/cabinet\n` +
    `📧 Email: support@nexoraexample.pro`,
  );
}

async function handleMyId(chatId: number | string): Promise<void> {
  await sendTelegramTo(chatId,
    `🆔 Ваш Telegram chat_id:\n<code>${chatId}</code>\n\n` +
    `Укажите его в настройках профиля на сайте, чтобы получать уведомления о заявках.`,
  );
}

async function handleStatusCommand(chatId: number | string, args: string): Promise<void> {
  const reqNum = args.trim().toUpperCase();
  if (!reqNum) {
    await sendTelegramTo(chatId, "❌ Укажите номер заявки. Пример:\n/status REQ-0042");
    return;
  }

  try {
    // Dynamic import to avoid circular deps and keep controller lean
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const request = await prisma.request.findFirst({
      where:  { requestNumber: reqNum },
      select: {
        requestNumber: true,
        status:        true,
        cryptoAmount:  true,
        cryptoAsset:   true,
        createdAt:     true,
      },
    });
    await prisma.$disconnect();

    if (!request) {
      await sendTelegramTo(chatId,
        `❌ Заявка <code>${reqNum}</code> не найдена.\nПроверьте номер и попробуйте снова.`,
      );
      return;
    }

    const STATUS_LABELS: Record<string, string> = {
      CREATED:          "🆕 Создана",
      WAITING_PAYMENT:  "⏳ Ожидает оплаты",
      CRYPTO_RECEIVED:  "💸 Крипта получена",
      AML_REVIEW:       "🔍 AML проверка",
      READY_FOR_PAYOUT: "✅ Готово к выплате",
      PROCESSING:       "⚙️ В обработке",
      COMPLETED:        "✅ Завершена",
      ON_HOLD:          "⏸ Приостановлена",
      CANCELLED:        "❌ Отменена",
    };
    const label = STATUS_LABELS[request.status] ?? request.status;
    const date  = new Date(request.createdAt).toLocaleDateString("ru-RU");

    await sendTelegramTo(chatId,
      `📋 <b>Заявка ${request.requestNumber}</b>\n` +
      `📌 Статус: <b>${label}</b>\n` +
      `💰 Сумма: ${request.cryptoAmount} ${request.cryptoAsset}\n` +
      `📅 Дата: ${date}`,
    );
  } catch {
    await sendTelegramTo(chatId,
      "⚠️ Не удалось получить статус. Попробуйте позже или обратитесь к менеджеру.",
    );
  }
}

// ─── main webhook handler ────────────────────────────────────────────────────

export async function handleTelegramWebhook(req: Request, res: Response): Promise<void> {
  // 1. Verify Telegram secret token (prevents spoofed requests)
  if (WEBHOOK_SECRET) {
    const incoming = req.headers["x-telegram-bot-api-secret-token"];
    if (incoming !== WEBHOOK_SECRET) {
      res.sendStatus(403);
      return;
    }
  }

  // Always respond 200 quickly so Telegram stops retrying
  res.sendStatus(200);

  const update  = req.body;
  const message = update?.message ?? update?.edited_message;
  if (!message) return;

  const chatId    = message.chat?.id;
  const username  = message.from?.username ? `@${message.from.username}` : "нет";
  const firstName = message.from?.first_name ?? "";
  const lastName  = message.from?.last_name  ?? "";
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Аноним";
  const text      = (message.text ?? "") as string;

  // 2. Handle bot commands
  if (text.startsWith("/")) {
    const [cmd, ...rest] = text.split(/\s+/);
    const command = cmd.split("@")[0].toLowerCase(); // strip @botname suffix

    switch (command) {
      case "/start":  await handleStart(chatId, firstName);         return;
      case "/help":   await handleHelp(chatId);                     return;
      case "/myid":   await handleMyId(chatId);                     return;
      case "/status": await handleStatusCommand(chatId, rest.join(" ")); return;
      default:
        await sendTelegramTo(chatId, "❓ Неизвестная команда. Напишите /help для списка команд.");
        return;
    }
  }

  // 3. Regular message — forward to admin + send auto-reply
  await sendTelegram(
    `📩 <b>Входящее сообщение</b>\n` +
    `👤 <b>${fullName}</b> (${username})\n` +
    `🆔 chat_id: <code>${chatId}</code>\n\n` +
    `💬 ${text || "[медиа-файл или стикер]"}\n\n` +
    `↩️ Ответить: <a href="tg://user?id=${chatId}">открыть чат</a>`,
  );

  await sendTelegramTo(chatId,
    `👋 Привет, ${firstName || ""}!\n\n` +
    `Ваше сообщение получено. Менеджер свяжется с вами в ближайшее время.\n\n` +
    `💡 Проверить статус заявки: /status REQ-XXXX\n\n` +
    `🔗 Личный кабинет: ${SITE_URL}/cabinet`,
  );
}
