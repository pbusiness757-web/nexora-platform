import express = require("express");
import requestsController = require("../controllers/requests.controller");

const router = express.Router();

router.get("/", requestsController.getRequests);
router.post("/", requestsController.createRequest);

export = router;
