import express = require("express");
import dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/stats", dashboardController.getStats);

export = router;
