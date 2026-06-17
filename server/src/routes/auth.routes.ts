import express = require("express");
import authController = require("../controllers/auth.controller");
import requireAuth = require("../middleware/requireAuth");
import loginRateLimit = require("../middleware/loginRateLimit");

const router = express.Router();

router.post("/login", loginRateLimit, authController.login);
router.post("/logout", authController.