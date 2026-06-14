import express = require("express");
import prisma = require("../services/prisma.service");
import prismaClient = require("@prisma/client");

const PARTNER_STATUSES = ["ACTIVE", "LIMITED", "LOW_RESERVE", "PAUSED"];

async function getPartners(_req: express.Request, res: express.Response) {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { name: "asc" } });
    res.json(partners);
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
    res.json(partner);
  } catch (error) {
    res.status(400).json({ error: "Failed to update partner" });
  }
}

export = { getPartners, createPartner, updatePartner };
