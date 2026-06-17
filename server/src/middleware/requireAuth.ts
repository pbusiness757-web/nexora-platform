import express = require("express");
import auth = require("../utils/auth");

/**
 * Admin auth guard. Apply to any route that must be admin-only:
 *   router.use(requireAuth)  or  router.post("/x", requireAuth, handler)
 */
function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const cookies = auth.parseCookies(req.headers.cookie);
  const payload = auth.verifyToken(cookies[auth.COOKIE_NAME]);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.nexoraUser = payload;
  next();
}

export = requireAuth;
