/// <reference types="node" />
import express = require("express");
import crypto = require("crypto");
import prisma = require("../services/prisma.service");
import audit = require("../utils/audit");

/** Generate a unique payout number: PAY-YYYYMMDD-XXXXXXXX */
function generatePayoutNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `PAY-${date}-${suffix}`;
}

async function assignPartner(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { id } = req.params;
    const operator = req.nexoraUser?.sub ?? "unknown";

    // 1. Load request (include client for country fallback, payout to detect duplicate)
    const request = await prisma.request.findUnique({
      where: { id: String(id) },
      include: {
        client: { select: { country: true } },
        payout: true,
      },
    });

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    // 2. Status guard: must be READY_FOR_PAYOUT
    if (request.status !== "READY_FOR_PAYOUT") {
      res.status(422).json({
        error: `Request status must be READY_FOR_PAYOUT, current status is ${request.status}`,
      });
      return;
    }

    // 3. AML guard: must not be REJECTED
    if (request.amlStatus === "REJECTED") {
      res.status(422).json({
        error: "Cannot assign partner: AML status is REJECTED",
      });
      return;
    }

    // 4. Must have payout currency and amount
    if (!request.payoutCurrency || request.payoutAmount === null) {
      res.status(422).json({
        error: "Request is missing payoutCurrency or payoutAmount",
      });
      return;
    }

    // 5. Idempotency: payout must not already exist
    if (request.payout) {
      res.status(409).json({
        error: "A payout already exists for this request",
        payoutId: request.payout.id,
      });
      return;
    }

    // 6. Resolve country for partner matching.
    //    Prefer the stored request.country (set on create from body).
    //    Fall back to client.country for legacy rows that predate the field.
    const matchCountry = request.country ?? request.client?.country ?? null;
    if (!matchCountry) {
      res.status(422).json({
        error: "Cannot determine payout country for partner matching",
      });
      return;
    }

    const payoutAmountNum = Number(request.payoutAmount);

    // 7. Find eligible partners
    const eligiblePartners = await prisma.partner.findMany({
      where: {
        country: matchCountry,
        currency: request.payoutCurrency,
        status: "ACTIVE",
        reserve: { gte: request.payoutAmount },
      },
    });

    if (eligiblePartners.length === 0) {
      res.status(422).json({
        error: `No eligible ACTIVE partners found for country=${matchCountry} currency=${request.payoutCurrency} with sufficient reserve (need ${payoutAmountNum})`,
      });
      return;
    }

    // 8. Select best: lowest feePercent first; on tie, highest reserve
    const bestPartner = eligiblePartners.slice().sort((a, b) => {
      const feeDiff = Number(a.feePercent) - Number(b.feePercent);
      if (Math.abs(feeDiff) > 1e-10) return feeDiff;
      return Number(b.reserve) - Number(a.reserve);
    })[0];

    // 9. Generate payout number (collision-safe)
    let payoutNumber = generatePayoutNumber();
    const existing = await prisma.payout.findUnique({ where: { payoutNumber } });
    if (existing) {
      payoutNumber = `${payoutNumber}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    }

    // 10. Atomic transaction:
    //     - create Payout linked to request + partner
    //     - decrement partner.reserve
    //     - update request.status to PROCESSING
    const [updatedRequest, newPayout] = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          payoutNumber,
          status: "PROCESSING",
          amount: request.payoutAmount,
          currency: request.payoutCurrency,
          requestId: request.id,
          partnerId: bestPartner.id,
        },
      });

      await tx.partner.update({
        where: { id: bestPartner.id },
        data: { reserve: { decrement: payoutAmountNum } },
      });

      const updReq = await tx.request.update({
        where: { id: request.id },
        data: { status: "PROCESSING" },
      });

      return [updReq, payout] as const;
    });

    // 11. Non-fatal side effects (fire-and-forget)
    prisma.requestStatusHistory.create({
      data: {
        requestId: request.id,
        fromStatus: "READY_FOR_PAYOUT",
        toStatus: "PROCESSING",
        changedBy: operator,
      },
    }).catch(() => { /* non-fatal */ });

    if (request.clientAccountId) {
      prisma.notification.create({
        data: {
          clientAccountId: request.clientAccountId,
          requestId: request.id,
          message: `Заявка #${request.requestNumber} передана в обработку партнёру ${bestPartner.name}`,
          isRead: false,
        },
      }).catch(() => { /* non-fatal */ });
    }

    // 12. Audit log (synchronous — important for compliance)
    await audit.writeAuditLog({
      action: "PARTNER_ASSIGNED",
      entityType: "Request",
      entityId: request.id,
      operatorName: operator,
    });

    // 13. Return updated entities
    res.json({
      request: updatedRequest,
      partner: {
        id:         bestPartner.id,
        name:       bestPartner.name,
        country:    bestPartner.country,
        currency:   bestPartner.currency,
        feePercent: bestPartner.feePercent,
        reserve:    Number(bestPartner.reserve) - payoutAmountNum,
      },
      payout: newPayout,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // Unique constraint on payout (race condition)
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      res.status(409).json({ error: "Payout was created concurrently — request already has a payout" });
      return;
    }
    res.status(500).json({ error: "Failed to assign partner" });
  }
}

export = { assignPartner };
