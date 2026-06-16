import express = require("express");
import requestsController = require("../controllers/requests.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", requestsController.getRequests);
router.get("/:id", requestsController.getRequestById);
router.post("/", requestsController.createReques