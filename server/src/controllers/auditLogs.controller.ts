import express = require("express");
import prisma = require("../services/prisma.service");

async function listAuditLogs(req: express.Request, res: express.Response) {
  try {
    const page    = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit   = Math.min(200, parseInt(req.query.limit as string) || 50);
    const action  = req.query.action  as string | undefined;
    const adminId = req.query.adminId as string | undefined;
    const skip    = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (action)  where.action  = { contains: action,  mode: "insensitive" };
    if (adminId) where.adminId = adminId;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          operator: { select: { email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to load audit logs" });
  }
}

export = { listAuditLogs };
