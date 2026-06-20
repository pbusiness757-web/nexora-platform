/// <reference types="node" />
import express = require("express");
import prisma = require("../services/prisma.service");
import audit = require("../utils/audit");

const ALLOWED_AML_STATUSES = ["PENDING", "PASSED", "REVIEW", "REJECTED"] as const;
type AmlStatusValue = typeof ALLOWED_AML_STATUSES[number];

const AML_STATUS_LABELS: Record<AmlStatusValue, string> = {
  PENDING:  "На рассмотрении",
  PASSED:   "Пройдена",
  REVIEW:   "Требует проверки",
  REJECTED: "Отклонена",
};

async function updateAml(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { id } = req.params;
    const { amlStatus, riskScore, amlComment } = req.body ?? {};

    // --- Validate amlStatus ---
    if (!ALLOWED_AML_STATUSES.includes(amlStatus)) {
      res.status(400).json({
        error: `Invalid amlStatus. Allowed: ${ALLOWED_AML_STATUSES.join(", ")}`,
      });
      return;
    }

    // --- Validate riskScore (optional, 0-100 integer) ---
    if (riskScore !== undefined && riskScore !== null) {
      const score = Number(riskScore);
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        res.status(400).json({ error: "riskScore must be an integer between 0 and 100" });
        return;
      }
    }

    // --- Validate amlComment (optional, max 2000 chars) ---
    if (amlComment !== undefined && amlComment !== null) {
      if (typeof amlComment !== "string") {
        res.status(400).json({ error: "amlComment must be a string" });
        return;
      }
      if (amlComment.length > 2000) {
        res.status(400).json({ error: "amlComment must not exceed 2000 characters" });
        return;
      }
    }

    // --- Confirm request exists ---
    const existing = await prisma.request.findUnique({
      where: { id: String(id) },
      select: { id: true, requestNumber: true, clientAccountId: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const operator = req.nexoraUser?.sub ?? "unknown";

    // --- Build update payload ---
    const updateData: {
      amlStatus: AmlStatusValue;
      amlReviewedAt: Date;
      amlReviewedBy: string;
      riskScore?: number | null;
      amlComment?: string | null;
    } = {
      amlStatus: amlStatus as AmlStatusValue,
      amlReviewedAt: new Date(),
      amlReviewedBy: operator,
    };

    if (riskScore !== undefined) {
      updateData.riskScore = riskScore === null ? null : Number(riskScore);
    }
    if (amlComment !== undefined) {
      updateData.amlComment = amlComment === null ? null : String(amlComment).trim() || null;
    }

    const updated = await prisma.request.update({
      where: { id: String(id) },
      data: updateData,
    });

    // --- Audit log ---
    await audit.writeAuditLog({
      action: `AML_UPDATE:${amlStatus}`,
      entityType: "Request",
      entityId: updated.id,
      operatorName: operator,
    });

    // --- Notify client on REJECTED (fire-and-forget) ---
    if (amlStatus === "REJECTED" && existing.clientAccountId) {
      const label = AML_STATUS_LABELS[amlStatus as AmlStatusValue];
      prisma.notification.create({
        data: {
          clientAccountId: existing.clientAccountId,
          requestId: existing.id,
          message: `AML проверка по заявке #${existing.requestNumber} не пройдена — ${label}`,
          isRead: false,
        },
      }).catch(() => { /* non-fatal */ });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update AML status" });
  }
}

export = { updateAml };
