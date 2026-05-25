-- AlterTable
ALTER TABLE "User" ADD COLUMN "positionsBuiltToday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "positionsBuiltDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PositionPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "ticker" TEXT,
    "chain" TEXT,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "positionSizePercent" DOUBLE PRECISION NOT NULL,
    "positionSizeUsdt" DOUBLE PRECISION,
    "stopLossPercent" DOUBLE PRECISION NOT NULL,
    "takeProfitPercent" DOUBLE PRECISION NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionPlan_userId_createdAt_idx" ON "PositionPlan"("userId", "createdAt");
CREATE INDEX "PositionPlan_tokenAddress_idx" ON "PositionPlan"("tokenAddress");

-- AddForeignKey
ALTER TABLE "PositionPlan" ADD CONSTRAINT "PositionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
