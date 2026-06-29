import express = require("express");
import prisma = require("../services/prisma.service");
import finance = require("../services/finance.service");
import * as csv from "../utils/csv";

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

async function exportCsv(_req: express.Request, res: express.Response): Promise<void> {
  try {
    const rows = await prisma.request.findMany({
      select: {
        requestNumber: true,
        createdAt: true,
        status: true,
        payoutCurrency: true,
        cryptoAmount: true,
        payoutAmount: true,
        nexoraFeeAmount: true,
        partnerFeeAmount: true,
        grossProfit: true,
        country: true,
        cryptoAsset: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    const headers = [
      "Номер", "Дата", "Статус", "Страна", "Актив",
      "Сумма крипто", "Валюта выплаты", "Сумма выплаты",
      "Комиссия Nexora", "Комиссия партнёра", "Прибыль",
    ];
    const data = rows.map((r: { requestNumber: string; createdAt: Date; status: string; country: string | null; cryptoAsset: string; cryptoAmount: unknown; payoutCurrency: string; payoutAmount: unknown; nexoraFeeAmount: unknown; partnerFeeAmount: unknown; grossProfit: unknown }) => [
      r.requestNumber,
      r.createdAt.toISOString().slice(0, 10),
      r.status,
      r.country ?? "",
      r.cryptoAsset,
      String(r.cryptoAmount),
      r.payoutCurrency,
      String(r.payoutAmount),
      String(r.nexoraFeeAmount ?? ""),
      String(r.partnerFeeAmount ?? ""),
      String(r.grossProfit ?? ""),
    ]);

    const output = csv.toCsv(headers, data);
    const filename = `nexora-finance-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("﻿" + output); // BOM for Excel
  } catch {
    res.status(500).json({ error: "Export failed" });
  }
}

export = { getSummary, exportCsv };
