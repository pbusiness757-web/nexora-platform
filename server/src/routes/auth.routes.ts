import express = require("express");
import authController = require("../controllers/auth.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export = router;
