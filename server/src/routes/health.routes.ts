import express = require("express");

const router = express.Router();

router.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok" });
});

export = router;
