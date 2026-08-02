-- AlterTable
ALTER TABLE "User" ADD COLUMN     "oauthProvider" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;
