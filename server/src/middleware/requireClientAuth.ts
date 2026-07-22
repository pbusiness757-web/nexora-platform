import express = require("express");
import clientAuth = require("../utils/clientAuth");
import * as denylist from "../services/jwtDenylist.service";

function requireClientAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const cookies = clientAuth.parseCookies(req.headers.cookie);
  const token = cookies[clientAuth.CLIENT_COOKIE_NAME];
  const payload = clientAuth.verifyClientToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (denylist.isDenied(token)) {
    res.status(401).json({ error: "Session has been invalidated" });
    return;
  }
  req.nexoraClientUser = payload;
  next();
}

export = requireClientAuth;
