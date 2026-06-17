/// <reference types="node" />
import crypto = require("crypto");

const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
export const CLIENT_COOKIE_NAME = "nexora_client_token";
export const CLIENT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type ClientTokenPayload = {
  sub: string;   // clientAccountId
  email: string;
  role: "CLIENT";
  exp: number;
};

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function signClientToken(accountId: string, email: string): string {
  const payload: ClientTokenPayload = {
    sub: accountId,
    email,
    role: "CLIENT",
    exp: nowSeconds() + CLIENT_SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyClientToken(token: string | undefined): ClientTokenPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as ClientTokenPayload;
    if (payload.role !== "CLIENT") return null;
    if (typeof payload.exp !== "number" || payload.exp < nowSeconds()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = stored.split(":");
    if (!salt || !key) { resolve(false); return; }
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else {
        try {
          resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derived));
        } catch {
          resolve(false);
        }
      }
    });
  });
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
