-- CreateEnum
CREATE TYPE "AmlStatus" AS ENUM ('PENDING', 'PASSED', 'REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "Request"
  ADD COLUMN "amlStatus"     "AmlStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "riskScore"     INTEGER,
  ADD COLUMN "amlComment"    TEXT,
  ADD COLUMN "amlReviewedAt" TIMESTAMP(3),
  ADD COLUMN "amlReviewedBy" TEXT;
