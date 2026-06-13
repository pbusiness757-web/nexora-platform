"use strict";
const prisma = require("../services/prisma.service");
const countryCurrency = require("../utils/countryCurrency");
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
async function getRequests(_req, res) {
    try {
        const requests = await prisma.request.findMany();
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch requests" });
    }
}
async function getRequestById(req, res) {
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
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch request" });
    }
}
async function createRequest(req, res) {
    try {
        const { requestNumber, status, cryptoAsset, network, cryptoAmount, payoutAmount, clientId, country, } = req.body;
        // Payout currency is derived from the country, never trusted from the client.
        const payoutCurrency = countryCurrency.getPayoutCurrency(country);
        if (!payoutCurrency) {
            res.status(400).json({ error: "Unsupported payout country" });
            return;
        }
        const request = await prisma.request.create({
            data: {
                requestNumber,
                status,
                cryptoAsset,
                network,
                cryptoAmount,
                payoutCurrency,
                payoutAmount,
                clientId,
            },
        });
        res.status(201).json(request);
    }
    catch (error) {
        res.status(400).json({ error: "Failed to create request" });
    }
}
async function updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!ALLOWED_STATUSES.includes(status)) {
            res.status(400).json({ error: "Invalid status" });
            return;
        }
        const updated = await prisma.request.update({
            where: { id: String(id) },
            data: { status },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ error: "Failed to update status" });
    }
}
module.exports = { getRequests, getRequestById, createRequest, updateStatus };
