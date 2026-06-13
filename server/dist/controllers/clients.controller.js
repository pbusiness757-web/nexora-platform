"use strict";
const prisma = require("../services/prisma.service");
async function getClients(_req, res) {
    try {
        const clients = await prisma.client.findMany();
        res.json(clients);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch clients" });
    }
}
async function createClient(req, res) {
    try {
        const { companyName, country, riskLevel } = req.body;
        const client = await prisma.client.create({
            data: { companyName, country, riskLevel },
        });
        res.status(201).json(client);
    }
    catch (error) {
        res.status(400).json({ error: "Failed to create client" });
    }
}
module.exports = { getClients, createClient };
