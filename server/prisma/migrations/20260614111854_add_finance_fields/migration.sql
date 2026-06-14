-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "cryptoAsset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "cryptoAmount" DECIMAL NOT NULL,
    "payoutCurrency" TEXT NOT NULL,
    "payoutAmount" DECIMAL NOT NULL,
    "rateSnapshot" DECIMAL,
    "nexoraFeePercent" DECIMAL NOT NULL DEFAULT 2.0,
    "nexoraFeeAmount" DECIMAL,
    "partnerFeePercent" DECIMAL NOT NULL DEFAULT 1.0,
    "partnerFeeAmount" DECIMAL,
    "grossProfit" DECIMAL,
    "netPayoutAmount" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Request_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Request" ("clientId", "createdAt", "cryptoAmount", "cryptoAsset", "id", "network", "payoutAmount", "payoutCurrency", "rateSnapshot", "requestNumber", "status") SELECT "clientId", "createdAt", "cryptoAmount", "cryptoAsset", "id", "network", "payoutAmount", "payoutCurrency", "rateSnapshot", "requestNumber", "status" FROM "Request";
DROP TABLE "Request";
ALTER TABLE "new_Request" RENAME TO "Request";
CREATE UNIQUE INDEX "Request_requestNumber_key" ON "Request"("requestNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
