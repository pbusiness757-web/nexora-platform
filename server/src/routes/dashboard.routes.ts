import express = require("express");
import dashboardController = require("../controllers/dashboard.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/stats", dashboardController.getStats);

export = router;
