-- AlterTable
ALTER TABLE "User" ADD COLUMN "openPositionsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "ticker" TEXT,
    "chain" TEXT,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "positionSizePercent" DOUBLE PRECISION,
    "positionSizeUsdt" DOUBLE PRECISION,
    "stopLossPrice" DOUBLE PRECISION NOT NULL,
    "takeProfitPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "aiPlanId" TEXT,
    "lastRiskLevel" TEXT,
    "lastPriceUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "UserPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPosition_userId_status_idx" ON "UserPosition"("userId", "status");
CREATE INDEX "UserPosition_tokenAddress_idx" ON "UserPosition"("tokenAddress");

-- AddForeignKey
ALTER TABLE "UserPosition" ADD CONSTRAINT "UserPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
