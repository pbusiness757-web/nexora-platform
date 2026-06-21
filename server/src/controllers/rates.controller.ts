import express = require("express");
import rates = require("../services/rates.service");

async function getRates(_req: express.Request, res: express.Response) {
  try {
    const snapshot = await rates.getRates();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rates" });
  }
}

async function updateRat