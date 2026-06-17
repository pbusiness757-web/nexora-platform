-- CreateTable ClientAccount
CREATE TABLE "ClientAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    CONSTRAINT "ClientAccount_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "ClientAccount_email_key" ON "ClientAccount"("email");

-- AlterTable Request
ALTER TABLE "Request" ADD COLUMN "clientAccountId" TEXT;

-- AddForeignKey Request -> ClientAccount
ALTER TABLE "Request" ADD CONSTRAINT "Request_clientAccountId_fkey"
    FOREIGN KEY ("clientAccountId") REFERENCES "ClientAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable ProofUpload
CREATE TABLE "ProofUpload" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProofUpload_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey ProofUpload -> Request
ALTER TABLE "ProofUpload" ADD CONSTRAINT "ProofUpload_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "Request"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "requestId" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey Notification -> ClientAccount
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_clientAccountId_fkey"
    FOREIGN KEY ("clientAccountId") REFERENCES "ClientAccount"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
