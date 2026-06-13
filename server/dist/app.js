"use strict";
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const healthRoutes = require("./routes/health.routes");
const clientsRoutes = require("./routes/clients.routes");
const requestsRoutes = require("./routes/requests.routes");
const partnersRoutes = require("./routes/partners.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const app = express();
app.use(helmet.default({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api", healthRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/partners", partnersRoutes);
app.use("/api/dashboard", dashboardRoutes);
module.exports = app;
