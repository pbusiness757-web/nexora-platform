import express = require("express");
import partnersController = require("../controllers/partners.controller");

const router = express.Router();

router.get("/", partnersController.getPartners);
router.post("/", partnersController.createPartner);
router.patch("/:id", partnersController.updatePartner);

export = router;
