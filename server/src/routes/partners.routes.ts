import express = require("express");
import partnersController = require("../controllers/partners.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", partnersController.getPartners);
router.post("/", partnersController.createPartner);
router.patch("/:id", partnersController.updatePartner);
router.delete("/:id", partnersController.deletePartner);

export = router;
