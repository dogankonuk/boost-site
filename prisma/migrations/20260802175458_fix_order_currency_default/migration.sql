-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- DataFix: price was always stored in USD, but existing rows were created
-- with the old (wrong) "TRY" default. Correct the historical data to match reality.
UPDATE "Order" SET "currency" = 'USD' WHERE "currency" = 'TRY';
