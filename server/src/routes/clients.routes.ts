import express = require("express");
import clientsController = require("../controllers/clients.controller");

const router = express.Router();

router.get("/", clientsController.getClients);
router.post("/", clientsController.createClient);

export = router;
