-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "searchHistoryId" TEXT,
    "ticker" TEXT,
    "tokenAddress" TEXT,
    "chain" TEXT,
    "contractScore" INTEGER,
    "liquidityScore" INTEGER,
    "volatilityScore" INTEGER,
    "overallRisk" "RiskLevel" NOT NULL,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_createdAt_idx" ON "SearchHistory"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TokenCheck_searchHistoryId_key" ON "TokenCheck"("searchHistoryId");

-- CreateIndex
CREATE INDEX "TokenCheck_userId_createdAt_idx" ON "TokenCheck"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TokenCheck_tokenAddress_idx" ON "TokenCheck"("tokenAddress");

-- CreateIndex
CREATE INDEX "TokenCheck_ticker_idx" ON "TokenCheck"("ticker");

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenCheck" ADD CONSTRAINT "TokenCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenCheck" ADD CONSTRAINT "TokenCheck_searchHistoryId_fkey" FOREIGN KEY ("searchHistoryId") REFERENCES "SearchHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
