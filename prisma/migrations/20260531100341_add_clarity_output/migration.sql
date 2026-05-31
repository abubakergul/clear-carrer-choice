-- AlterTable
ALTER TABLE "FitInsight" ADD COLUMN     "clarityInsightVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "clarityOutput" TEXT,
ADD COLUMN     "clarityUnlockedAt" TIMESTAMP(3);
