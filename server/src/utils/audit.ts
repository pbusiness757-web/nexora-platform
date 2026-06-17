/// <reference types="node" />
import prisma = require("../services/prisma.service");

async function writeAuditLog(opts: {
  action: string;
  entityType: string;
  entityId: string;
  operatorName: string;
  operatorId?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        operatorName: opts.operatorName,
        operatorId: opts.operatorId ?? null,
      },
    });
  } catch {
    // Audit log failures must never break the main operation.
  }
}

export = { writeAuditLog };
