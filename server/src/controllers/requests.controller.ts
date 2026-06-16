import express = require("express");
import prisma = require("../services/prisma.service");
import countryCurrency = require("../utils/countryCurrency");
import rates = require("../services/rates.service");
import finance = require("../services/finance.service");

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

async function getRequests(_req: express.Request, res: express.Response) {
  try {
    const requests = await prisma.request.findMany();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
}

async function getRequestById(req: express.Request, res: express.Response) {
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

async function createRequest(req: express.Request, res: express.Response) {
  try {
    // status is NOT accepted from the client — always forced to CREATED.
    const { requestNumber, cryptoAsset, network, cryptoAmount, clientId, country } =
      req.body ?? {};

    // Validate required string fields.
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

    // Payout currency is derived from the country, never trusted from the client.
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

    // payoutAmount and the rate are computed server-side — never trusted from the client.
    const rate = await rates.getPayoutRate(payoutCurrency);
    if (rate === null) {
      res.status(503).json({ error: "Rates unavailable" });
      return;
    }
    const payoutAmount = amount * rate;

    // Fees/profit are computed server-side — never trusted from the client.
    const fin = finance.computeFinance(payoutAmount);

    const request = await prisma.request.create({
      data: {
        requestNumber: requestNumber.trim(),
        status: "CREATED", // always forced — never from client input
        cryptoAsset: cryptoAsset.trim(),
        network: network.trim(),
        cryptoAmount,
        payoutCurrency,
        payoutAmount,
        rateSnapshot: rate,
        nexoraFeePercent: fin.nexoraF