-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'draft';

-- Backfill: posts that are already live were never "submitted" under the new
-- gate, so mark them approved instead of leaving them as misleadingly "draft".
UPDATE "BlogPost" SET "reviewStatus" = 'approved' WHERE "isPublished" = true;
