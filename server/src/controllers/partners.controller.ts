import express = require("express");
import prisma = require("../services/prisma.service");

async function getPartners(_req: express.Request, res: express.Response) {
  try {
    const partners = await prisma.partner.findMany();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch partners" });
  }
}

async function createPartner(req: express.Request, res: express.Response) {
  try {
    const { name, country, currency, reserve, feePercent, status } = req.body;
    const partner = await prisma.partner.create({
      data: { name, country, currency, reserve, feePercent, status },
    });
    res.status(201).json(partner);
  } catch (error) {
    res.status(400).json({ error: "Failed to create partner" });
  }
}

export = { getPartners, createPartner };
