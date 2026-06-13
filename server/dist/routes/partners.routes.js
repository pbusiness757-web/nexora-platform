"use strict";
const express = require("express");
const partnersController = require("../controllers/partners.controller");
const router = express.Router();
router.get("/", partnersController.getPartners);
router.post("/", partnersController.createPartner);
module.exports = router;
