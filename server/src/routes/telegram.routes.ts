import express = require("express");
import { handleTelegramWebhook } from "../controllers/telegramWebhook.controller";

const router = express.Router();

// Telegram sends POST updates here
// Registered via: /api/telegram/setWebhook (see below) or manually via curl
router.post("/webhook", handleTelegramWebhook);

// Convenience endpoint to register the webhook (call once after deploy)
router.get("/setWebhook", async (req, res) => {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  if (!token) { res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" }); return; }

  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexoraexample.pro";
  const webhookUrl = `${siteUrl}/api/telegram/webhook`;

  try {
    const body: Record<string, unknown> = {
      url:                  webhookUrl,
      drop_pending_updates: true,
      allowed_updates:      ["message", "edited_message"],
    };
    if (secret) body["secret_token"] = secret;

    const r    = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await r.json() as { ok: boolean; description?: string };
    res.json({ ok: data.ok, description: data.description, webhookUrl, secretSet: !!secret });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export = router;
