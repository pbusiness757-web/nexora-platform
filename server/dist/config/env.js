"use strict";
/// <reference types="node" />
const dotenv = require("dotenv");
dotenv.config();
const env = {
    port: Number(process.env.PORT) || 4000,
    nodeEnv: process.env.NODE_ENV ?? "development",
};
module.exports = env;
