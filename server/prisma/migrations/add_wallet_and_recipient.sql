-- Migration: add walletAddress and recipientDetails to Request
-- Run on VPS: psql $DATABASE_URL -f this_file.sql

ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS "walletAddress"    TEXT;
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS "recipientDetails" TEXT;
