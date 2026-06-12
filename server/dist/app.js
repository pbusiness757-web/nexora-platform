"use strict";
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const healthRoutes = require("./routes/health.routes");
const app = express();
app.use(helmet.default());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api", healthRoutes);
module.exports = app;
//# sourceMappingURL=app.js.map