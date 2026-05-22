-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isHot" BOOLEAN NOT NULL DEFAULT false;
