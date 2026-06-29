// @ts-ignore — nodemailer installed on VPS via package.json; not available in dev sandbox
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer: { createTransport: (opts: Record<string, unknown>) => { sendMail: (msg: Record<string, unknown>) => Promise<unknown> } } = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@nexora.io";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "";

// If no SMTP host configured, log instead of sending
const enabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: { sendMail: (msg: Record<string, unknown>) => Promise<unknown> } | null = null;

if (enabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!to) return;
  if (!enabled || !transporter) {
    console.log(`[EMAIL] (no SMTP) To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
  } catch (err) {
    console.error("[EMAIL] Failed to send:", err);
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  CREATED:          "Создана",
  WAITING_PAYMENT:  "Ожидание оплаты",
  CRYPTO_RECEIVED:  "Криптовалюта получена",
  AML_REVIEW:       "AML-проверка",
  READY_FOR_PAYOUT: "Готово к выплате",
  PROCESSING:       "В обработке",
  COMPLETED:        "Завершена",
  ON_HOLD:          "Приостановлена",
};

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#2563eb;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Nexora</span>
            <span style="color:rgba(255,255,255,0.7);font-size:12px;margin-left:8px;font-weight:600;text-transform:uppercase;">Platform</span>
          </td>
        </tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Nexora — инфраструктура выплат крипто-в-банк для СНГ.
              Это автоматическое уведомление, не отвечайте на него.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function sendRequestCreated(opts: {
  clientEmail: string;
  requestNumber: string;
  cryptoAmount: string;
  cryptoAsset: string;
  payoutCurrency: string;
  payoutAmount: string;
}): Promise<void> {
  const { clientEmail, requestNumber, cryptoAmount, cryptoAsset, payoutCurrency, payoutAmount } = opts;

  const clientHtml = base("Ваша заявка создана", `
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Заявка создана</h2>
    <p style="margin:0 0 24px;color:#475569;">Ваша заявка на выплату принята в обработку.</p>
    <table width="100%" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;">Номер заявки</td>
        <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:700;font-family:monospace;">${requestNumber}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">Сумма отправки</td>
        <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #f1f5f9;">${cryptoAmount} ${cryptoAsset}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:12px 16px;font-size:13px;color:#64748b;border-top:1px solid #f1f5f9;">Сумма выплаты</td>
        <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:600;border-top:1px solid #f1f5f9;">${payoutAmount} ${payoutCurrency}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#64748b;">
      Вы получите уведомление при поступлении криптовалюты и после завершения выплаты.
    </p>
  `);

  const adminHtml = base("Новая заявка", `
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Новая заявка на платформе</h2>
    <p style="margin:0 0 8px;color:#475569;">Номер: <strong>${requestNumber}</strong></p>
    <p style="margin:0 0 8px;color:#475569;">Клиент: ${clientEmail}</p>
    <p style="margin:0;color:#475569;">Сумма: ${cryptoAmount} ${cryptoAsset} → ${payoutAmount} ${payoutCurrency}</p>
  `);

  await Promise.all([
    send(clientEmail, `Заявка ${requestNumber} создана — Nexora`, clientHtml),
    ADMIN_EMAIL ? send(ADMIN_EMAIL, `[Nexora] Новая заявка ${requestNumber}`, adminHtml) : Promise.resolve(),
  ]);
}

export async function sendStatusChanged(opts: {
  clientEmail: string;
  requestNumber: string;
  newStatus: string;
  payoutAmount?: string;
  payoutCurrency?: string;
}): Promise<void> {
  const { clientEmail, requestNumber, newStatus, payoutAmount, payoutCurrency } = opts;

  // Only notify client on meaningful status transitions
  const notifyStatuses = new Set([
    "CRYPTO_RECEIVED", "READY_FOR_PAYOUT", "PROCESSING", "COMPLETED", "ON_HOLD",
  ]);
  if (!notifyStatuses.has(newStatus)) return;

  const label = STATUS_LABELS[newStatus] ?? newStatus;
  const isCompleted = newStatus === "COMPLETED";
  const isHold = newStatus === "ON_HOLD";

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">
      Статус заявки изменён
    </h2>
    <p style="margin:0 0 24px;color:#475569;">
      Заявка <strong>${requestNumber}</strong> перешла в статус:
    </p>
    <div style="display:inline-block;padding:10px 20px;border-radius:24px;
         background:${isCompleted ? "#ecfdf5" : isHold ? "#fef2f2" : "#eff6ff"};
         color:${isCompleted ? "#059669" : isHold ? "#ef4444" : "#2563eb"};
         font-weight:700;font-size:15px;margin-bottom:24px;">
      ${label}
    </div>
    ${isCompleted && payoutAmount && payoutCurrency ? `
    <p style="margin:0;font-size:15px;color:#0f172a;font-weight:600;">
      Выплата ${payoutAmount} ${payoutCurrency} завершена.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748b;">
      Средства направлены на ваш банковский счёт. Сроки зачисления зависят от банка (обычно 1-3 рабочих дня).
    </p>` : ""}
    ${isHold ? `
    <p style="margin:0;font-size:13px;color:#64748b;">
      Заявка временно приостановлена. Наша команда свяжется с вами в ближайшее время.
    </p>` : ""}
  `;

  const subject = isCompleted
    ? `Выплата по заявке ${requestNumber} завершена — Nexora`
    : `Заявка ${requestNumber}: ${label} — Nexora`;

  await send(clientEmail, subject, base(subject, body));
}

export async function sendCryptoReceived(opts: {
  clientEmail: string;
  requestNumber: string;
  cryptoAmount: string;
  cryptoAsset: string;
}): Promise<void> {
  const { clientEmail, requestNumber, cryptoAmount, cryptoAsset } = opts;
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Криптовалюта получена</h2>
    <p style="margin:0 0 24px;color:#475569;">
      По заявке <strong>${requestNumber}</strong> зачислено <strong>${cryptoAmount} ${cryptoAsset}</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#64748b;">
      Выплата будет обработана после прохождения AML-проверки. Обычно это занимает до 30 минут.
    </p>
  `;
  await send(clientEmail, `Криптовалюта по заявке ${requestNumber} получена — Nexora`,
             base("Криптовалюта получена", body));
}
