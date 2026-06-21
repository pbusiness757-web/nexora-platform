import express = require("express");
import prisma = require("../services/prisma.service");

async function listPayouts(req: express.Request, res: express.Response) {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string | undefined;
    const skip   = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          request: {
            select: {
              requestNumber: true,
              cryptoAsset: true,
              payoutCurrency: true,
              country: true,
              client: { select: { email: true } },
            },
          },
          partner: { select: { name: true, country: true } },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to load payouts" });
  }
}

async function getPayout(req: express.Request, res: express.Response) {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: req.params.id },
      include: {
        request: {
          select: {
            requestNumber: true,
            cryptoAsset: true,
            network: true,
            cryptoAmount: true,
            payoutCurrency: true,
            country: true,
            client: { select: { email: true } },
          },
        },
        partner: true,
      },
    });
    if (!payout) return res.status(404).json({ error: "Payout not found" });
    res.json(payout);
  } catch {
    res.status(500).json({ error: "Failed to load payout" });
  }
}

async function updatePayoutStatus(req: express.Request, res: express.Response) {
  try {
    const { status, note } = req.body as { status: string; note?: string };
    const allowed = ["PROCESSING", "COMPLETED", "FAILED", "ON_HOLD"];
    if (!allowed.includes(status)) {
      return res.status(422).json({ error: "Invalid payout status" });
    }
    const payout = await prisma.payout.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(payout);
  } catch {
    res.status(500).json({ error: "Failed to update payout" });
  }
}

export = { listPayouts, getPayout, updatePayoutStatus };
