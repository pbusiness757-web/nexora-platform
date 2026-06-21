import express = require("express");
import requireAuth = require("../middleware/requireAuth");
import auditLogsController = require("../controllers/auditLogs.controller");

const router = express.Router();

router.get("/", requireAuth, auditLogsController.listAuditLogs);

export = router;
