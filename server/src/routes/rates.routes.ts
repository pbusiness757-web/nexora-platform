import express = require("express");
import ratesController = require("../controllers/rates.controller");
import requireAuth = require("../middleware/requireAuth");

const router = express.Router();

rout