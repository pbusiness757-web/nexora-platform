"use strict";
const prisma = require("../services/prisma.service");
async function getPartners(_req, res) {
    try {
        const partners = await prisma.partner.findMany();
        res.json(partners);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch partners" });
    }
}
async function createPartner(req, res) {
    try {
        const { name, country, currency, reserve, feePercent, status } = req.body;
        const partner = await prisma.partner.create({
            data: { name, country, currency, reserve, feePercent, status },
        });
        res.status(201).json(partner);
    }
    catch (error) {
        res.status(400).json({ error: "Failed to create partner" });
    }
}
module.exports = { getPartners, createPartner };
