-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ratedAt" TIMESTAMP(3),
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "review" TEXT;
