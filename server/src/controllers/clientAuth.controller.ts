/// <reference types="node" />
import express = require("express");
import prisma = require("../services/prisma.service");
import clientAuth = require("../utils/clientAuth");
import * as denylist from "../services/jwtDenylist.service";

const IS_PROD = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: IS_PROD,
  path: "/",
};

async function register(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const existing = await prisma.clientAccount.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await clientAuth.hashPassword(password);
    const account = await prisma.clientAccount.create({
      data: { email: email.trim().toLowerCase(), passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
    const token = clientAuth.signClientToken(account.id, account.email);
    res.cookie(clientAuth.CLIENT_COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: clientAuth.CLIENT_SESSION_TTL_SECONDS * 1000,
    });
    res.status(201).json({ user: { id: account.id, email: account.email } });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
}

async function login(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const account = await prisma.clientAccount.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!account) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const ok = await clientAuth.verifyPassword(password, account.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    await prisma.clientAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });
    const token = clientAuth.signClientToken(account.id, account.email);
    res.cookie(clientAuth.CLIENT_COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: clientAuth.CLIENT_SESSION_TTL_SECONDS * 1000,
    });
    res.json({ user: { id: account.id, email: account.email } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
}

async function logout(req: express.Request, res: express.Response): Promise<void> {
  const cookies = clientAuth.parseCookies(req.headers.cookie);
  const token = cookies[clientAuth.CLIENT_COOKIE_NAME];
  if (token) {
    const payload = clientAuth.verifyClientToken(token);
    if (payload) {
      denylist.addToDenylist(token, payload.exp);
    }
  }
  res.clearCookie(clientAuth.CLIENT_COOKIE_NAME, cookieOptions);
  res.json({ ok: true });
}

async function me(req: express.Request, res: express.Response): Promise<void> {
  const client = req.nexoraClientUser;
  if (!client) {
    res.status(401).json({ authenticated: false });
    return;
  }
  try {
    const account = await prisma.clientAccount.findUnique({
      where: { id: client.sub },
      select: { id: true, email: true, createdAt: true, lastLoginAt: true },
    });
    if (!account) {
      res.status(401).json({ authenticated: false });
      return;
    }
    const unread = await prisma.notification.count({
      where: { clientAccountId: client.sub, isRead: false },
    });
    res.json({ id: account.id, email: account.email, unreadCount: unread });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch account" });
  }
}

async function changePassword(req: express.Request, res: express.Response): Promise<void> {
  const client = req.nexoraClientUser;
  if (!client) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      res.status(400).json({ error: "currentPassword and newPassword are required" }); return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" }); return;
    }
    const account = await prisma.clientAccount.findUnique({ where: { id: client.sub } });
    if (!account) { res.status(404).json({ error: "Account not found" }); return; }
    const ok = await clientAuth.verifyPassword(currentPassword, account.passwordHash);
    if (!ok) { res.status(401).json({ error: "Current password is incorrect" }); return; }
    const passwordHash = await clientAuth.hashPassword(newPassword);
    await prisma.clientAccount.update({ where: { id: client.sub }, data: { passwordHash } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to change password" });
  }
}

async function profile(req: express.Request, res: express.Response): Promise<void> {
  const client = req.nexoraClientUser;
  if (!client) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const account = await prisma.clientAccount.findUnique({
      where: { id: client.sub },
      select: { id: true, email: true, createdAt: true, lastLoginAt: true },
    });
    if (!account) { res.status(404).json({ error: "Account not found" }); return; }
    const totalRequests = await prisma.request.count({ where: { clientAccountId: client.sub } });
    res.json({ ...account, totalRequests });
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

export = { register, login, logout, me, changePassword, profile };
