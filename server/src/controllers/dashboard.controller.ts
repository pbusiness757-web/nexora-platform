import express = require("express");
import prisma = require("../services/prisma.service");

async function getStats(_req: express.Request, res: express.Response) {
  try {
    const [
      totalRequests,
      createdRequests,
      processingRequests,
      completedRequests,
      cryptoAgg,
      payoutAgg,
      activePartners,
      totalClients,
    ] = await Promise.all([
      prisma.request.count(),
      prisma.request.count({ where: { status: "CREATED" } }),
      prisma.request.count({ where: { status: "PROCESSING" } }),
      prisma.request.count({ where: { status: "COMPLETED" } }),
      prisma.request.aggregate({ _sum: { cryptoAmount: true } }),
      prisma.request.aggregate({ _sum: { payoutAmount: true } }),
      prisma.partner.count({ where: { status: "ACTIVE" } }),
      prisma.client.count(),
    ]);

    res.json({
      totalRequests,
      createdRequests,
      processingRequests,
      completedRequests,
      totalCryptoVolume: cryptoAgg._sum.cryptoAmount ?? 0,
      totalPayoutVolume: payoutAgg._sum.payoutAmount ?? 0,
      activePartners,
      totalClients,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}

export = { getStats };
