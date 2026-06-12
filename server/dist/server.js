"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="node" />
const app = require("./app");
const env = require("./config/env");
app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
});
//# sourceMappingURL=server.js.map