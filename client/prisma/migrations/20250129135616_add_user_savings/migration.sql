-- AlterTable
ALTER TABLE "User" ADD COLUMN     "quotes_with_savings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_savings" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
