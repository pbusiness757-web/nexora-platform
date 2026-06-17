/// <reference types="node" />
import express = require("express");

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

type Entry = { count: number; resetAt: number };

// In-memory store: IP -> attempt entry.
// Good enough for MVP (single process). Replace with Redis for multi-instance.
const store = new Map<string, Entry>();

// Prune expired entries every 15 minutes to avoid unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (entry.resetAt <= now) store.delete(ip);
  }
}, WINDOW_MS);

function loginRateLimit(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const now = Date.now();
  let entry = store.get(ip);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, entry);
  }

  entry.count += 1;

  const remaining = Math.max(0, MAX_ATTEMPTS - entry.count);
  const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);

  res.setHeader("X-RateLimit-Limit", String(MAX_ATTEMPTS));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > MAX_ATTEMPTS) {
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      error: "Too many login attempts. Try again in 15 minutes.",
      retryAfterSeconds: retryAfterSec,
    });
    return;
  }

  next();
}

export = loginRateLimit;
