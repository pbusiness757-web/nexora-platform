import express = require("express");
import prisma = require("../services/prisma.service");
import audit = require("../utils/audit");

async function listAdmins(_req: express.Request, res: express.Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
}

async function createAdmin(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { email, name, role } = req.body ?? {};

    if (typeof email !== "string" || !email.trim().includes("@")) {
      res.status(400).json({ error: "Valid email required" }); return;
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" }); return;
    }
    const allowedRoles = ["ADMIN", "OPERATOR"];
    const resolvedRole = typeof role === "string" && allowedRoles.includes(role) ? role : "OPERATOR";

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: "User with this email already exists" }); return;
    }

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: resolvedRole as "ADMIN" | "OPERATOR",
      },
    });

    await audit.writeAuditLog({
      action: "CREATE_ADMIN",
      entityType: "User",
      entityId: user.id,
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });

    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: "Failed to create admin" });
  }
}

async function deleteAdmin(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id: String(id) } });
    if (!existing) {
      res.status(404).json({ error: "User not found" }); return;
    }
    await prisma.user.delete({ where: { id: String(id) } });
    await audit.writeAuditLog({
      action: "DELETE_ADMIN",
      entityType: "User",
      entityId: String(id),
      operatorName: req.nexoraUser?.sub ?? "unknown",
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete admin" });
  }
}

export = { listAdmins, createAdmin, deleteAdmin };
