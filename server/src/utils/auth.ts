/// <reference types="node" />
import crypto = require("crypto");

const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";

export const COOKIE_NAME = "nexora_token";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

type TokenPayload = {
  sub: string;
  role: string;
  exp: number;
};

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function signToken(sub: string, role: string): string {
  const payload: TokenPayload = {
    sub,
    role,
    exp: nowSeconds() + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined): TokenPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < nowSeconds()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}
