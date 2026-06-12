import express = require("express");
import prisma = require("../services/prisma.service");

async function getClients(_req: express.Request, res: express.Response) {
  try {
    const clients = await prisma.client.findMany();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
}

async function createClient(req: express.Request, res: express.Response) {
  try {
    const { companyName, country, riskLevel } = req.body;
    const client = await prisma.client.create({
      data: { companyName, country, riskLevel },
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ error: "Failed to create client" });
  }
}

export = { getClients, createClient };
