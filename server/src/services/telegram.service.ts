/** Telegram notification service — sends messages via Bot API */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;
const API_URL   = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

export async function sendTelegram(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return; // silently skip if not configured
  try {
    await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        chat_id:    CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // non-fatal — never crash the main flow
  }
}

export async function notifyNewRequest(params: {
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
    (params.clientEmail ? `👤 Клиент: ${params.clientEmail}\n` : "") +
    `\n🔗 <a href="https://nexoraexample.pro/admin/requests">Открыть панель</a>`;
  await sendTelegram(text);
}

export async function notifyStatusChanged(params: {
  requestNumber: string;
  newStatus:     string;
  changedBy:     string;
}): Promise<void> {
  const STATUS_LABELS: Record<string, string> = {
    CREATED:          "Создана",
    WAITING_PAYMENT:  "Ожидает оплаты",
    CRYPTO_RECEIVED:  "Крипта получена",
    AML_REVIEW:       "AML проверка",
    READY_FOR_PAYOUT: "Готово к выплате",
    PROCESSING:       "В обработке",
    COMPLETED:        "✅ Завершена",
    ON_HOLD:          "⏸ Приостановлена",
  };
  const label = STATUS_LABELS[params.newStatus] ?? params.newStatus;
  const text =
    `🔄 <b>Смена статуса</b>\n` +
    `📋 Заявка: <code>${params.requestNumber}</code>\n` +
    `📌 Новый статус: <b>${label}</b>\n` +
    `👤 Оператор: ${params.changedBy}`;
  await sendTelegram(text);
}
