import express = require("express");
import prisma = require("../services/prisma.service");
import countryCurrency = require("../utils/countryCurrency");

async function getClients(_req: express.Request, res: express.Response) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { requests: true } } },
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
}

async function createClient(req: express.Request, res: express.Response) {
  try {
    const { companyName, country, riskLevel } = req.body ?? {};

    if (typeof companyName !== "string" || companyName.trim() === "") {
      res.status(400).json({ error: "companyName is required" });
      return;
    }
    if (typeof country !== "string" || !countryCurrency.isSupportedPayoutCountry(country)) {
      res.status(400).json({ error: "Unsupported country" });
      return;
    }

    const client = await prisma.client.create({
      data: {
        companyName: companyName.trim(),
        country,
        ...(riskLevel ? { riskLevel } : {}),
      },
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ error: "Failed to create client" });
  }
}

export = { getClients, createClient };
