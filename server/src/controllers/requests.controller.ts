import express = require("express");
import prisma = require("../services/prisma.service");
import countryCurrency = require("../utils/countryCurrency");
import rates = require("../services/rates.service");
import finance = require("../services/finance.service");
import audit = require("../utils/audit");

const ALLOWED_STATUSES = [
  "CREATED",
  "WAITING_PAYMENT",
  "CRYPTO_RECEIVED",
  "AML_REVIEW",
  "READY_FOR_PAYOUT",
  "PROCESSING",
  "COMPLETED",
  "ON_HOLD",
];

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Создана",
  WAITING_PAYMENT: "Ожидает оплаты",
  CRYPTO_RECEIVED: "Крипта получена",
  AML_REVIEW: "AML проверка",
  READY_FOR_PAYOUT: "Готово к выплате",
  PROCESSING: "В обработке",
  COMPLETED: "Завершена",
  ON_HOLD: "Приостановлена",
};

function parsePagination(query: express.Request["query"]): {
  skip: number; take: number; page: number; limit: number;
} {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "50"), 10) || 50));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

async function getRequests(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        orderBy: { createdAt: "desc" },
        include: { client: { select: { id: true, companyName: true } } },
        skip,
        take,
      }),
      prisma.request.count(),
    ]);
    res.json({ data: requests, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
}

async function getRequestById(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { id } = req.params;
    const request = await prisma.request.findUnique({
      where: { id: String(id) },
      include: { client: true, payout: true },
    });
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch request" });
  }
}

async function createRequest(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { requestNumber, cryptoAsset, network, cryptoAmount, clientId, country } =
      req.body ?? {};

    if (typeof requestNumber !== "string" || requestNumber.trim() === "") {
      res.status(400).json({ error: "requestNumber is required" });
      return;
    }
    if (typeof cryptoAsset !== "string" || cryptoAsset.trim() === "") {
      res.status(400).json({ error: "cryptoAsset is required" });
      return;
    }
    if (typeof network !== "string" || network.trim() === "") {
      res.status(400).json({ error: "network is required" });
      return;
    }
    if (typeof clientId !== "string" || clientId.trim() === "") {
      res.status(400).json({ error: "clientId is required" });
      return;
    }
    if (typeof country !== "string" || country.trim() === "") {
      res.status(400).json({ error: "country is required" });
      return;
    }

    const payoutCurrency = countryCurrency.getPayoutCurrency(country);
    if (!payoutCurrency) {
      res.status(400).json({ error: "Unsupported payout country" });
      return;
    }

    const amount = Number(cryptoAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Invalid crypto amount" });
      return;
    }

    const rate = await rates.getPayoutRate(payoutCurrency);
    if (rate === null) {
      res.status(503).json({ error: "Rates unavailable" });
      return;
    }
    const payoutAmount = amount * rate;
    const fin = finance.computeFinance(payoutAmount);

    const request = await prisma.request.create({
      data: {
        requestNumber: requestNumber.trim(),
        status: "CREATED",
        cryptoAsset: cryptoAsset.trim(),
        network: network.trim(),
        cryptoAmount,
        payoutCurrency,
        payoutAmount,
        rateSnapshot: rate,
        nexoraFeePercent: fin.nexoraFeePercent,
        nexoraFeeAmount: fin.nexoraFeeAmount,
        partnerFeePercent: fin.partnerFeePercent,
        partnerFeeAmount: fin.partnerFeeAmount,
        grossProfit: fin.grossProfit,
        netPayoutAmount: fin.netPayoutAmount,
        clientId,
      },
    });

    await audit.writeAuditLog({
      action: "CREATE",
      entityType: "Request",
      entityId: request.id,
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: "Failed to create request" });
  }
}

async function updateStatus(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const updated = await prisma.request.update({
      where: { id: String(id) },
      data: { status },
    });

    await audit.writeAuditLog({
      action: `STATUS_CHANGE:${status}`,
      entityType: "Request",
      entityId: updated.id,
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    // Notify client if request is linked to a client portal account
    if (updated.clientAccountId) {
      const label = STATUS_LABELS[status] ?? status;
      prisma.notification.create({
        data: {
          clientAccountId: updated.clientAccountId,
          requestId: updated.id,
          message: `Статус заявки #${updated.requestNumber} изменён: ${label}`,
          isRead: false,
        },
      }).catch(() => { /* non-fatal */ });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Failed to update status" });
  }
}

async function deleteRequest(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.request.findUnique({ where: { id: String(id) } });
    if (!existing) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    await prisma.request.delete({ where: { id: String(id) } });
    await audit.writeAuditLog({
      action: "DELETE",
      entityType: "Request",
      entityId: String(id),
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });
    res.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Foreign key constraint") || msg.includes("foreign key")) {
      res.status(409).json({ error: "Cannot delete request with existing payout" });
      return;
    }
    res.status(400).json({ error: "Failed to delete request" });
  }
}

export = { getRequests, getRequestById, createRequest, updateStatus, deleteRequest };
