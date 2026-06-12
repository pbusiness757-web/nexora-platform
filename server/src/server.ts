/// <reference types="node" />
import app = require("./app");
import env = require("./config/env");

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
