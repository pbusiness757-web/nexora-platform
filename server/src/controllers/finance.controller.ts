import express = require("express");
import prisma = require("../services/prisma.service");
import finance = require("../services/finance.service");

async function getSummary(_req: express.Request, res: express.Response) {
  try {
    const requests = await prisma.request.findMany({
      select: {
        status: true,
        payoutCurrency: true,
        cryptoAmount: true,
        payoutAmount: true,
        nexoraFeeAmount: true,
        partnerFeeAmount: true,
        grossProfit: true,
      },
    });
    res.json(finance.summarize(requests));
  } catch (error) {
    res.status(500).json({ error: "Failed to build finance summary" });
  }
}

export = { getSummary };
