import express = require("express");
import adminsController = require("../controllers/admins.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/",      adminsController.listAdmins);
router.post("/",     adminsController.createAdmin);
router.delete("/:id", adminsController.deleteAdmin);

export = router;
