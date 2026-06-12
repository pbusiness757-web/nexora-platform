import express = require("express");
import cors = require("cors");
import helmet = require("helmet");
import morgan = require("morgan");
import healthRoutes = require("./routes/health.routes");
import clientsRoutes = require("./routes/clients.routes");
import requestsRoutes = require("./routes/requests.routes");
import partnersRoutes = require("./routes/partners.routes");

const app = express();

app.use(helmet.default());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/partners", partnersRoutes);

export = app;
