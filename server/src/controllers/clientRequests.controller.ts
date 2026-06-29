/// <reference types="node" />
import express = require("express");
import fs = require("fs");
import path = require("path");
import crypto = require("crypto");
import prisma = require("../services/prisma.service");
import countryCurrency = require("../utils/countryCurrency");
import rates = require("../services/rates.service");
import finance = require("../services/finance.service");
import * as email from "../services/email.service";

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

function ensureUploadsDir(subDir: string): string {
  const dir = path.join(UPLOADS_DIR, subDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function parsePagination(query: express.Request["query"]): {
  skip: number; take: number; page: number; limit: number;
} {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "20"), 10) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

/** Generate a unique request number: NXR-YYYYMMDD-XXXXXX */
function generateRequestNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `NXR-${date}-${suffix}`;
}

async function createMyRequest(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const { cryptoAsset, network, cryptoAmount, country } = req.body ?? {};

    // --- Validation ---
    if (typeof cryptoAsset !== "string" || cryptoAsset.trim() === "") {
      res.status(400).json({ error: "cryptoAsset is required" });
      return;
    }
    if (typeof network !== "string" || network.trim() === "") {
      res.status(400).json({ error: "network is required" });
      return;
    }
    if (typeof country !== "string" || country.trim() === "") {
      res.status(400).json({ error: "country is required" });
      return;
    }

    const amount = Number(cryptoAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "cryptoAmount must be a positive number" });
      return;
    }

    const payoutCurrency = countryCurrency.getPayoutCurrency(country.trim());
    if (!payoutCurrency) {
      res.status(400).json({ error: "Unsupported payout country" });
      return;
    }

    // --- Derive financials server-side ---
    const rate = await rates.getPayoutRate(payoutCurrency);
    if (rate === null) {
      res.status(503).json({ error: "Exchange rates unavailable, try again shortly" });
      return;
    }

    const payoutAmount = amount * rate;
    const fin = finance.computeFinance(payoutAmount);
    const requestNumber = generateRequestNumber();

    // Ensure uniqueness (extremely rare collision, but guard it)
    const existing = await prisma.request.findUnique({ where: { requestNumber } });
    const finalNumber = existing
      ? `${requestNumber}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`
      : requestNumber;

    // Resolve the Client record for this account.
    // ClientAccount has no direct FK to Client — the link is through Request.clientAccountId.
    // Strategy:
    //   1. Look for an existing Client already used in a prior request by this account.
    //   2. If none exists (first-time user), auto-create a Client using the account's email
    //      and the country from this request body.
    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      select: { email: true },
    });
    if (!account) {
      res.status(401).json({ error: "Account not found" });
      return;
    }

    const linkedRequest = await prisma.request.findFirst({
      where: { clientAccountId: accountId },
      select: { clientId: true },
      orderBy: { createdAt: "desc" },
    });

    let clientId: string;
    if (linkedRequest) {
      // Existing account — reuse the Client already linked via prior requests
      clientId = linkedRequest.clientId;
    } else {
      // First-time user — auto-provision a Client record
      const newClient = await prisma.client.create({
        data: {
          companyName: `Client ${account.email}`,
          country: country.trim(),
          riskLevel: "LOW",
        },
      });
      clientId = newClient.id;
    }

    const request = await prisma.request.create({
      data: {
        requestNumber: finalNumber,
        status: "CREATED",
        cryptoAsset: cryptoAsset.trim().toUpperCase(),
        network: network.trim().toUpperCase(),
        cryptoAmount: amount,
        payoutCurrency,
        payoutAmount,
        rateSnapshot: rate,
        nexoraFeePercent: fin.nexoraFeePercent,
        nexoraFeeAmount: fin.nexoraFeeAmount,
        partnerFeePercent: fin.partnerFeePercent,
        partnerFeeAmount: fin.partnerFeeAmount,
        grossProfit: fin.grossProfit,
        netPayoutAmount: fin.netPayoutAmount,
        clientId,
        clientAccountId: accountId,
        country: country.trim(),
      },
    });

    // Notification — fire and forget
    prisma.notification.create({
      data: {
        clientAccountId: accountId,
        requestId: request.id,
        message: `Заявка #${request.requestNumber} создана`,
        isRead: false,
      },
    }).catch(() => { /* non-fatal */ });

    // Email — fire and forget
    prisma.clientAccount.findUnique({
      where: { id: accountId },
      select: { email: true },
    }).then((account: { email: string } | null) => {
      if (!account?.email) return;
      email.sendRequestCreated({
        clientEmail: account.email,
        requestNumber: request.requestNumber,
        cryptoAmount: String(request.cryptoAmount),
        cryptoAsset: request.cryptoAsset,
        payoutCurrency: request.payoutCurrency,
        payoutAmount: String(request.payoutAmount),
      }).catch(() => { /* non-fatal */ });
    }).catch(() => { /* non-fatal */ });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to create request" });
  }
}

async function getMyRequests(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const { skip, take, page, limit } = parsePagination(req.query);
    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where: { clientAccountId: accountId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          requestNumber: true,
          cryptoAsset: true,
          cryptoAmount: true,
          payoutCurrency: true,
          payoutAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.request.count({ where: { clientAccountId: accountId } }),
    ]);
    res.json({ data: requests, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
}

async function getMyRequestById(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const { id } = req.params;
    const request = await prisma.request.findUnique({
      where: { id: String(id) },
      include: {
        client: { select: { companyName: true, country: true } },
        payout: true,
        proofUploads: { select: { id: true, originalName: true, mimeType: true, size: true, uploadedAt: true } },
      },
    });
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (request.clientAccountId !== accountId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch request" });
  }
}

async function uploadProof(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const requestId = String(req.params.id);

    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (request.clientAccountId !== accountId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { originalName, mimeType, data } = req.body ?? {};
    if (typeof originalName !== "string" || originalName.trim() === "") {
      res.status(400).json({ error: "originalName is required" });
      return;
    }
    if (typeof mimeType !== "string") {
      res.status(400).json({ error: "mimeType is required" });
      return;
    }
    if (typeof data !== "string" || data.length === 0) {
      res.status(400).json({ error: "data (base64) is required" });
      return;
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ALLOWED_TYPES.includes(mimeType)) {
      res.status(400).json({ error: "Unsupported file type. Allowed: jpg, png, webp, pdf" });
      return;
    }

    const buffer = Buffer.from(data, "base64");
    const MAX_SIZE = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ error: "File exceeds 10 MB limit" });
      return;
    }

    const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
    const safeExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const dir = ensureUploadsDir(requestId);
    fs.writeFileSync(path.join(dir, filename), buffer);

    const upload = await prisma.proofUpload.create({
      data: { requestId, filename, originalName: originalName.trim(), mimeType, size: buffer.length },
    });

    res.status(201).json({ id: upload.id, originalName: upload.originalName, size: upload.size, uploadedAt: upload.uploadedAt });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
}

async function downloadProof(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const { requestId, uploadId } = req.params;

    const upload = await prisma.proofUpload.findUnique({
      where: { id: String(uploadId) },
      include: { request: { select: { id: true, clientAccountId: true } } },
    });

    if (!upload) { res.status(404).json({ error: "File not found" }); return; }
    if (upload.requestId !== String(requestId)) { res.status(404).json({ error: "File not found" }); return; }
    if (upload.request.clientAccountId !== accountId) { res.status(403).json({ error: "Forbidden" }); return; }

    const safeFilename = path.basename(upload.filename);
    const safeRequestId = path.basename(upload.requestId);
    const filePath = path.resolve(UPLOADS_DIR, safeRequestId, safeFilename);

    if (!filePath.startsWith(path.resolve(UPLOADS_DIR))) {
      res.status(400).json({ error: "Invalid file path" });
      return;
    }
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: "File not found on disk" }); return; }

    const safeName = upload.originalName.replace(/[^\w.\-]/g, "_");
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const contentType = ALLOWED_TYPES.includes(upload.mimeType) ? upload.mimeType : "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", String(upload.size));
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Download failed" });
  }
}

async function getNotifications(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const notifications = await prisma.notification.findMany({
      where: { clientAccountId: accountId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

async function markNotificationsRead(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    await prisma.notification.updateMany({
      where: { clientAccountId: accountId, isRead: false },
      data: { isRead: true },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
}

async function getStatusHistory(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const { id } = req.params;

    // Ownership check first
    const request = await prisma.request.findUnique({
      where: { id: String(id) },
      select: { clientAccountId: true },
    });
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (request.clientAccountId !== accountId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const history = await prisma.requestStatusHistory.findMany({
      where: { requestId: String(id) },
      orderBy: { createdAt: "asc" },
      select: { id: true, fromStatus: true, toStatus: true, changedBy: true, createdAt: true },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status history" });
  }
}

export = {
  createMyRequest,
  getMyRequests,
  getMyRequestById,
  getStatusHistory,
  uploadProof,
  downloadProof,
  getNotifications,
  markNotificationsRead,
};
