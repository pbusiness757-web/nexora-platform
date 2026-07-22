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
import clientAuthRoutes = require("./routes/clientAuth.routes");
import clientRequestsRoutes = require("./routes/clientRequests.routes");
import payoutsRoutes = require("./routes/payouts.routes");
import auditLogsRoutes = require("./routes/auditLogs.routes");
import adminsRoutes = require("./routes/admins.routes");
import telegramRoutes = require("./routes/telegram.routes");
import publicRoutes = require("./routes/public.routes");

const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(
  helmet.default({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "12mb" })); // raised for base64 file uploads

// Admin routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/partners", partnersRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rates", ratesRoutes);
app.use("/api/admin/finance", financeRoutes);
app.use("/api/payouts", payoutsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/admins", adminsRoutes);

// Client portal routes
app.use("/api/client-auth", clientAuthRoutes);
app.use("/api/client-requests", clientRequestsRoutes);

// Telegram bot webhook
app.use("/api/telegram", telegramRoutes);

// Public (no auth) routes
app.use("/api/public", publicRoutes);

export = app;
