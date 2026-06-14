/// <reference types="node" />
import express = require("express");
import auth = require("../utils/auth");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@nexora.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "nexora-admin";
const IS_PROD = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: IS_PROD,
  path: "/",
};

async function login(req: express.Request, res: express.Response) {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const emailOk = auth.safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase());
    const passwordOk = auth.safeEqual(password, ADMIN_PASSWORD);
    if (!emailOk || !passwordOk) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = auth.signToken(ADMIN_EMAIL, "ADMIN");
    res.cookie(auth.COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: auth.SESSION_TTL_SECONDS * 1000,
    });
    res.json({ user: { email: ADMIN_EMAIL, role: "ADMIN" } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
}

async function logout(_req: express.Request, res: express.Response) {
  res.clearCookie(auth.COOKIE_NAME, cookieOptions);
  res.json({ ok: true });
}

async function me(req: express.Request, res: express.Response) {
  const cookies = auth.parseCookies(req.headers.cookie);
  const payload = auth.verifyToken(cookies[auth.COOKIE_NAME]);
  if (!payload) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    user: { email: payload.sub, role: payload.role },
  });
}

export = { login, logout, me };
