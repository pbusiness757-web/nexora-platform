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

async function updateRates(req: express.Request, res: express.Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const incoming: Record<string, number> = {};

    for (const cur of rates.PAYOUT_CURRENCIES) {
      const v = body[cur];
      if (v !== undefined) {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) {
          res.status(400).json({ error: `Invalid value for ${cur}: must be a positive number` });
          return;
        }
        incoming[cur] = n;
      }
    }

    if (Object.keys(incoming).length === 0) {
      res.status(400).json({ error: "No valid currency values provided" });
      return;
    }

    const snapshot = rates.setRates(incoming);
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: "Failed to update rates" });
  }
}

export = { getRates, updateRates };
