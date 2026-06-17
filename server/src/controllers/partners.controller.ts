import express = require("express");
import prisma = require("../services/prisma.service");
import prismaClient = require("@prisma/client");
import audit = require("../utils/audit");

const PARTNER_STATUSES = ["ACTIVE", "LIMITED", "LOW_RESERVE", "PAUSED"];

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

async function getPartners(req: express.Request, res: express.Response) {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const [partners, total] = await Promise.all([
      prisma.partner.findMany({ orderBy: { name: "asc" }, skip, take }),
      prisma.partner.count(),
    ]);
    res.json({ data: partners, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch partners" });
  }
}

async function createPartner(req: express.Request, res: express.Response) {
  try {
    const { name, country, currency, reserve, feePercent, status } =
      req.body ?? {};

    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "name is required" });
      return;
    }
    if (typeof country !== "string" || country.trim() === "") {
      res.status(400).json({ error: "country is required" });
      return;
    }
    if (typeof currency !== "string" || currency.trim() === "") {
      res.status(400).json({ error: "currency is required" });
      return;
    }
    if (reserve === undefined || feePercent === undefined) {
      res.status(400).json({ error: "reserve and feePercent are required" });
      return;
    }
    if (status !== undefined && !PARTNER_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        country,
        currency,
        reserve,
        feePercent,
        ...(status ? { status } : {}),
      },
    });

    await audit.writeAuditLog({
      action: "CREATE",
      entityType: "Partner",
      entityId: partner.id,
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.status(201).json(partner);
  } catch (error) {
    res.status(400).json({ error: "Failed to create partner" });
  }
}

async function updatePartner(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;
    const { reserve, feePercent, status } = req.body ?? {};

    if (status !== undefined && !PARTNER_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const partner = await prisma.partner.update({
      where: { id: String(id) },
      data: {
        ...(reserve !== undefined ? { reserve } : {}),
        ...(feePercent !== undefined ? { feePercent } : {}),
        ...(status !== undefined
          ? { status: status as prismaClient.$Enums.PartnerStatus }
          : {}),
      },
    });

    await audit.writeAuditLog({
      action: "UPDATE",
      entityType: "Partner",
      entityId: partner.id,
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.json(partner);
  } catch (error) {
    res.status(400).json({ error: "Failed to update partner" });
  }
}

async function deletePartner(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.partner.findUnique({ where: { id: String(id) } });
    if (!existing) {
      res.status(404).json({ error: "Partner not found" });
      return;
    }

    await prisma.partner.delete({ where: { id: String(id) } });

    await audit.writeAuditLog({
      action: "DELETE",
      entityType: "Partner",
      entityId: String(id),
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Foreign key constraint") || msg.includes("foreign key")) {
      res.status(409).json({ error: "Cannot delete partner with existing payouts" });
      return;
    }
    res.status(400).json({ error: "Failed to delete partner" });
  }
}

export = { getPartners, createPartner, updatePartner, deletePartner };
