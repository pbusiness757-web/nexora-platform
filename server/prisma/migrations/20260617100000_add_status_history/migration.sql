-- CreateTable RequestStatusHistory
CREATE TABLE "RequestStatusHistory" (
    "id"         TEXT NOT NULL,
    "requestId"  TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus"   TEXT NOT NULL,
    "changedBy"  TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RequestStatusHistory"
    ADD CONSTRAINT "RequestStatusHistory_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "Request"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
