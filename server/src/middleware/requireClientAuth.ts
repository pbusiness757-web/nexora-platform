import express = require("express");
import clientAuth = require("../utils/clientAuth");

function requireClientAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const cookies = clientAuth.parseCookies(req.headers.cookie);
  const payload = clientAuth.verifyClientToken(cookies[clientAuth.CLIENT_COOKIE_NAME]);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.nexoraClientUser = payload;
  next();
}

export = requireClientAuth;
