-- AlterTable
ALTER TABLE "User" ADD COLUMN     "checksUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyResetDate" TIMESTAMP(3),
ADD COLUMN     "payproSubscriptionId" TEXT,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateTable
CREATE TABLE "PayProOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payproCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayProOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayProOrder_orderId_key" ON "PayProOrder"("orderId");

-- CreateIndex
CREATE INDEX "PayProOrder_userId_createdAt_idx" ON "PayProOrder"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PayProOrder" ADD CONSTRAINT "PayProOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
