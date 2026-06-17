import express = require("express");
import prisma = require("../services/prisma.service");
import countryCurrency = require("../utils/countryCurrency");
import audit = require("../utils/audit");

const VALID_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function parsePagination(query: express.Request["query"]): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "50"), 10) || 50));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

async function getClients(req: express.Request, res: express.Response) {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { requests: true } } },
        skip,
        take,
      }),
      prisma.client.count(),
    ]);
    res.json({ data: clients, total, page, limit });
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
    if (riskLevel !== undefined && !VALID_RISK_LEVELS.includes(riskLevel)) {
      res.status(400).json({ error: "Invalid riskLevel" });
      return;
    }

    const client = await prisma.client.create({
      data: {
        companyName: companyName.trim(),
        country,
        ...(riskLevel ? { riskLevel } : {}),
      },
    });

    await audit.writeAuditLog({
      action: "CREATE",
      entityType: "Client",
      entityId: client.id,
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ error: "Failed to create client" });
  }
}

async function updateClient(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;
    const { companyName, country, riskLevel } = req.body ?? {};

    if (
      companyName === undefined &&
      country === undefined &&
      riskLevel === undefined
    ) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    if (companyName !== undefined && (typeof companyName !== "string" || companyName.trim() === "")) {
      res.status(400).json({ error: "companyName must be a non-empty string" });
      return;
    }
    if (country !== undefined && !countryCurrency.isSupportedPayoutCountry(country)) {
      res.status(400).json({ error: "Unsupported country" });
      return;
    }
    if (riskLevel !== undefined && !VALID_RISK_LEVELS.includes(riskLevel)) {
      res.status(400).json({ error: "Invalid riskLevel" });
      return;
    }

    const client = await prisma.client.update({
      where: { id: String(id) },
      data: {
        ...(companyName !== undefined ? { companyName: companyName.trim() } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(riskLevel !== undefined ? { riskLevel } : {}),
      },
    });

    await audit.writeAuditLog({
      action: "UPDATE",
      entityType: "Client",
      entityId: client.id,
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.json(client);
  } catch (error) {
    res.status(400).json({ error: "Failed to update client" });
  }
}

async function deleteClient(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.client.findUnique({ where: { id: String(id) } });
    if (!existing) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    await prisma.client.delete({ where: { id: String(id) } });

    await audit.writeAuditLog({
      action: "DELETE",
      entityType: "Client",
      entityId: String(id),
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Foreign key constraint") || msg.includes("foreign key")) {
      res.status(409).json({ error: "Cannot delete client with existing requests" });
      return;
    }
    res.status(400).json({ error: "Failed to delete client" });
  }
}

export = { getClients, createClient, updateClient, deleteClient };
