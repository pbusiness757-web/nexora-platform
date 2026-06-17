import express = require("express");
import clientsController = require("../controllers/clients.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", clientsController.getClients);
router.post("/", clientsController.createClient);
router.patch("/:id", clientsController.updateClient);
router.delete("/:id", clientsController.deleteClient);

export = router;
