-- AlterTable: add country column to Request (nullable, no default needed)
ALTER TABLE "Request" ADD COLUMN "country" TEXT;
