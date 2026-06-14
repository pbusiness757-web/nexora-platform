import express = require("express");
import cors = require("cors");
import helmet = require("helmet");
import morgan = require("morgan");
import healthRoutes = require("./routes/health.routes");
import clientsRoutes = require("./routes/clients.routes");
import requestsRoutes = require("./routes/requests.routes");
import partnersRoutes = require("./routes/partners.routes");
import dashboardRoutes = require("./routes/dashboard.routes");
import authRoutes = require("./routes/auth.routes");
import ratesRoutes = require("./routes/rates.routes");
import financeRoutes = require("./routes/finance.routes");

const app = express();

// Auth cookies require a specific origin + credentials (cannot use "*").
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(
  helmet.default({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/partners", partnersRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rates", ratesRoutes);
app.use("/api/admin/finance", financeRoutes);

export = app;
