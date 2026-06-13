"use strict";
const prisma = require("../services/prisma.service");
async function getStats(_req, res) {
    try {
        const [totalRequests, createdRequests, activeRequests, processingRequests, completedRequests, cryptoAgg, payoutAgg, activePartners, totalPartners, totalClients,] = await Promise.all([
            prisma.request.count(),
            prisma.request.count({ where: { status: "CREATED" } }),
            prisma.request.count({
                where: { status: { notIn: ["COMPLETED", "ON_HOLD"] } },
            }),
            prisma.request.count({ where: { status: "PROCESSING" } }),
            prisma.request.count({ where: { status: "COMPLETED" } }),
            prisma.request.aggregate({ _sum: { cryptoAmount: true } }),
            prisma.request.aggregate({ _sum: { payoutAmount: true } }),
            prisma.partner.count({ where: { status: "ACTIVE" } }),
            prisma.partner.count(),
            prisma.client.count(),
        ]);
        res.json({
            totalRequests,
            createdRequests,
            activeRequests,
            processingRequests,
            completedRequests,
            totalCryptoVolume: cryptoAgg._sum.cryptoAmount ?? 0,
            totalPayoutVolume: payoutAgg._sum.payoutAmount ?? 0,
            activePartners,
            totalPartners,
            totalClients,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
}
module.exports = { getStats };
