import express = require("express");
import requireAuth = require("../middleware/requireAuth");
import payoutsController = require("../controllers/payouts.controller");

const router = express.Router();

router.get("/",      requireAuth, payoutsController.listPayouts);
router.get("/:id",   requireAuth, payoutsController.getPayout);
router.patch("/:id/status", requireAuth, payoutsController.updatePayoutStatus);

export = router;
