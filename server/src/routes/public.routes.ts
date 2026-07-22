import express = require("express");
import prisma = require("../services/prisma.service");

const router = express.Router();

const STATUS_LABELS: Record<string, string> = {
  CREATED:          "Создана",
  WAITING_PAYMENT:  "Ожидает оплаты",
  CRYPTO_RECEIVED:  "Крипта получена",
  AML_REVIEW:       "AML проверка",
  READY_FOR_PAYOUT: "Готово к выплате",
  PROCESSING:       "В обработке",
  COMPLETED:        "Завершена",
  ON_HOLD:          "Приостановлена",
};

const STATUS_STEP_INDEX: Record<string, number> = {
  CREATED:          0,
  WAITING_PAYMENT:  1,
  CRYPTO_RECEIVED:  2,
  AML_REVIEW:       3,
  READY_FOR_PAYOUT: 4,
  PROCESSING:       5,
  COMPLETED:        6,
  ON_HOLD:          -1,
};

// GET /api/public/status/:requestNumber
// No auth required — returns only non-sensitive fields
router.get("/status/:requestNumber", async (req, res) => {
  try {
    const { requestNumber } = req.params;
    if (!requestNumber || requestNumber.length > 64) {
      res.status(400).json({ error: "Invalid request number" });
      return;
    }

    const request = await prisma.request.findFirst({
      where: { requestNumber: requestNumber.trim().toUpperCase() },
      select: {
        requestNumber: true,
        status:        true,
        cryptoAmount:  true,
        cryptoAsset:   true,
        payoutCurrency: true,
        country:       true,
        createdAt:     true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
          select:  { toStatus: true, createdAt: true },
        },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    res.json({
      requestNumber: request.requestNumber,
      status:        request.status,
      statusLabel:   STATUS_LABELS[request.status] ?? request.status,
      stepIndex:     STATUS_STEP_INDEX[request.status] ?? 0,
      cryptoAmount:  String(request.cryptoAmount),
      cryptoAsset:   request.cryptoAsset,
      payoutCurrency: request.payoutCurrency,
      country:       request.country ?? "",
      createdAt:     request.createdAt,
      history: (request.statusHistory ?? []).map((h: { toStatus: string; createdAt: Date }) => ({
        status:    h.toStatus,
        label:     STATUS_LABELS[h.toStatus] ?? h.toStatus,
        timestamp: h.createdAt,
      })),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch request status" });
  }
});

export = router;
