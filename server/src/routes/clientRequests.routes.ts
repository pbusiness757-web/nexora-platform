import express = require("express");
import clientRequestsController = require("../controllers/clientRequests.controller");
import requireClientAuth = require("../middleware/requireClientAuth");

const router = express.Router();

router.use(requireClientAuth);

router.get("/", clientRequestsController.getMyRequests);
router.post("/", clientRequestsController.createMyRequest);
router.get("/notifications", clientRequestsController.getNotifications);
router.post("/notifications/read", clientRequestsController.markNotificationsRead);
router.get("/:id", clientRequestsController.getMyRequestById);
router.get("/:id/status-history", clientRequestsController.getStatusHistory);
router.post("/:id/upload", clientRequestsController.uploadProof);
router.get("/:requestId/uploads/:uploadId", clientRequestsController.downloadProof);

export = router;
