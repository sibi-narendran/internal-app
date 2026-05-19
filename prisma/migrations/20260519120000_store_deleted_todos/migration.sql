-- AlterEnum
ALTER TYPE "TodoStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Todo_status_updatedAt_idx" ON "Todo"("status", "updatedAt");
