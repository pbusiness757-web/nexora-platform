import express = require("express");
import ratesController = require("../controllers/rates.controller");

const router = express.Router();

router.get("/", ratesController.getRates);

export = router;
