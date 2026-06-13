"use strict";
const express = require("express");
const requestsController = require("../controllers/requests.controller");
const router = express.Router();
router.get("/", requestsController.getRequests);
router.get("/:id", requestsController.getRequestById);
router.post("/", requestsController.createRequest);
router.patch("/:id/status", requestsController.updateStatus);
module.exports = router;
