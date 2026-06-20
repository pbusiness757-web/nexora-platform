import express = require("express");
import requestsController = require("../controllers/requests.controller");
import amlController = require("../controllers/aml.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", requestsController.getRequests);
router.post("/", requestsController.createRequest);
router.get("/:id", requestsController.getRequestById);
router.patch("/:id/status", requestsController.updateStatus);
router.patch("/:id/aml", amlController.updateAml);
router.get("/:id/status-history", requestsController.getStatusHistory);
router.delete("/:id", requestsController.deleteRequest);

export = router;
