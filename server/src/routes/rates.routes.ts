import express = require("express");
import ratesController = require("../controllers/rates.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/",  ratesController.getRates);
router.put("/",  requireAuth, ratesController.updateRates);

export = router;
