import express = require("express");
import prisma = require("../services/prisma.service");

async function getRequests(_req: express.Request, res: express.Response) {
  try {
    const requests = await prisma.request.findMany();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
}

async function createRequest(req: express.Request, res: express.Response) {
  try {
    const {
      requestNumber,
      status,
      cryptoAsset,
      network,
      cryptoAmount,
      payoutCurrency,
      payoutAmount,
      clientId,
    } = req.body;

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
  } catch (error) {
    res.status(400).json({ error: "Failed to create request" });
  }
}

export = { getRequests, createRequest };
