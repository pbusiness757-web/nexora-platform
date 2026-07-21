/** Telegram notification service — sends messages via Bot API */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexoraexample.pro";

type InlineButton = { text: string; url: string };
type InlineKeyboard = { inline_keyboard: InlineButton[][] };

/** Low-level sender — can target any chat_id, with optional inline keyboard */
export async function sendTelegramTo(
  chatId: number | string,
  text: string,
  keyboard?: InlineKeyboard,
): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:      chatId,
        text,
        parse_mode:   "HTML",
        ...(keyboard ? { reply_markup: keyboard } : {}),
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // non-fatal — never crash the main flow
  }
}

/** Send to the configured admin CHAT_ID */
export async function sendTelegram(text: string, keyboard?: InlineKeyboard): Promise<void> {
  if (!CHAT_ID) return;
  await sendTelegramTo(CHAT_ID, text, keyboard);
}

export async function notifyNewRequest(params: {
  requestId:     string;
  requestNumber: string;
  cryptoAmount:  string;
  cryptoAsset:   string;
  payoutCurrency: string;
  country:       string;
  clientEmail?:  string;
}): Promise<void> {
  const text =
    `🆕 <b>Новая заявка</b>\n` +
    `📋 Номер: <code>${params.requestNumber}</code>\n` +
    `💰 Сумма: <b>${params.cryptoAmount} ${params.cryptoAsset}</b>\n` +
    `🌍 Страна: ${params.country} (${params.payoutCurrency})\n` +
    (params.clientEmail ? `👤 Клиент: ${params.clientEmail}\n` : "");

  const keyboard: InlineKeyboard = {
    inline_keyboard: [[
      { text: "📂 Открыть заявку", url: `${SITE_URL}/admin/requests/${params.requestId}` },
      { text: "📋 Все заявки",     url: `${SITE_URL}/admin/requests` },
    ]],
  };
  await sendTelegram(text, keyboard);
}

export async function notifyStatusChanged(params: {
  requestId:     string;
  requestNumber: string;
  newStatus:     string;
  changedBy:     string;
}): Promise<void> {
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
  const label = STATUS_LABELS[params.newStatus] ?? params.newStatus;
  const text =
    `🔄 <b>Смена статуса</b>\n` +
    `📋 Заявка: <code>${params.requestNumber}</code>\n` +
    `📌 Новый статус: <b>${label}</b>\n` +
    `👤 Оператор: ${params.changedBy}`;

  const keyboard: InlineKeyboard = {
    inline_keyboard: [[
      { text: "📂 Открыть заявку", url: `${SITE_URL}/admin/requests/${params.requestId}` },
    ]],
  };
  await sendTelegram(text, keyboard);
}
