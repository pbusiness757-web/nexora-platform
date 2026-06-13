"use strict";
const express = require("express");
const clientsController = require("../controllers/clients.controller");
const router = express.Router();
router.get("/", clientsController.getClients);
router.post("/", clientsController.createClient);
module.exports = router;
