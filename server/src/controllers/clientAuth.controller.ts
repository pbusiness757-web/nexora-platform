/// <reference types="node" />
import express = require("express");
import prisma = require("../services/prisma.service");
import clientAuth = require("../utils/clientAuth");

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

async function logout(_req: express.Request, res: express.Response): Promise<void> {
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

export = { register, login, logout, me };
