import express = require("express");
import clientAuthController = require("../controllers/clientAuth.controller");
import requireClientAuth = require("../middleware/requireClientAuth");
import loginRateLimit = require("../middleware/loginRateLimit");

const router = express.Router();

router.post("/register", loginRateLimit, clientAuthController.register);
router.post("/login", loginRateLimit, clientAuthController.login);
router.post("/logout", clientAuthController.logout);
router.get("/me", requireClientAuth, clientAuthController.me);

export = router;
