/// <reference types="node" />
import express = require("express");
import fs = require("fs");
import path = require("path");
import prisma = require("../services/prisma.service");

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
    // Ownership check — client can only see own requests
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
    const { id } = req.params;

    const request = await prisma.request.findUnique({ where: { id: String(id) } });
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if (request.clientAccountId !== accountId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Accept base64 JSON: { originalName, mimeType, data }
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
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ error: "File exceeds 10 MB limit" });
      return;
    }

    const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
    const safeExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const dir = ensureUploadsDir(id);
    fs.writeFileSync(path.join(dir, filename), buffer);

    const upload = await prisma.proofUpload.create({
      data: {
        requestId: id,
        filename,
        originalName: originalName.trim(),
        mimeType,
        size: buffer.length,
      },
    });

    res.status(201).json({
      id: upload.id,
      originalName: upload.originalName,
      size: upload.size,
      uploadedAt: upload.uploadedAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
}

async function downloadProof(req: express.Request, res: express.Response): Promise<void> {
  try {
    const accountId = req.nexoraClientUser!.sub;
    const { requestId, uploadId } = req.params;

    // Fetch upload record with its parent request
    const upload = await prisma.proofUpload.findUnique({
      where: { id: String(uploadId) },
      include: { request: { select: { id: true, clientAccountId: true } } },
    });

    if (!upload) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Verify upload belongs to the stated request
    if (upload.requestId !== String(requestId)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    // Ownership — client must own the request
    if (upload.request.clientAccountId !== accountId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Resolve file path; prevent path traversal by stripping directory components
    const safeFilename = path.basename(upload.filename);
    const safeRequestId = path.basename(upload.requestId);
    const filePath = path.resolve(UPLOADS_DIR, safeRequestId, safeFilename);

    // Ensure resolved path is still inside UPLOADS_DIR
    if (!filePath.startsWith(path.resolve(UPLOADS_DIR))) {
      res.status(400).json({ error: "Invalid file path" });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found on disk" });
      return;
    }

    // Sanitize originalName for Content-Disposition (strip non-ASCII and quotes)
    const safeName = upload.originalName.replace(/[^\w.\-]/g, "_");

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const contentType = ALLOWED_TYPES.includes(upload.mimeType)
      ? upload.mimeType
      : "application/octet-stream";

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

export = { getMyRequests, getMyRequestById, uploadProof, downloadProof, getNotifications, markNotificationsRead };
