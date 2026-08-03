-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "issueReport" TEXT,
ADD COLUMN     "issueReportedAt" TIMESTAMP(3),
ADD COLUMN     "issueResolved" BOOLEAN NOT NULL DEFAULT false;
