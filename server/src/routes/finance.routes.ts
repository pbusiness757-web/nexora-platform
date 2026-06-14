import express = require("express");
import financeController = require("../controllers/finance.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/summary", requireAuth, financeController.getSummary);

export = router;
