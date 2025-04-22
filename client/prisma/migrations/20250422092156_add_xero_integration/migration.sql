-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'UPLOAD';

-- CreateTable
CREATE TABLE "XeroConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XeroDocument" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "xeroId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "quoteId" TEXT,
    "fileUrl" TEXT,
    "originalData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XeroImportSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "totalDocuments" INTEGER NOT NULL,
    "processedDocuments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "XeroConnection_userId_idx" ON "XeroConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "XeroConnection_userId_tenantId_key" ON "XeroConnection"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "XeroDocument_connectionId_idx" ON "XeroDocument"("connectionId");

-- CreateIndex
CREATE INDEX "XeroDocument_quoteId_idx" ON "XeroDocument"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "XeroDocument_connectionId_xeroId_key" ON "XeroDocument"("connectionId", "xeroId");

-- CreateIndex
CREATE INDEX "XeroImportSession_userId_idx" ON "XeroImportSession"("userId");

-- CreateIndex
CREATE INDEX "XeroImportSession_connectionId_idx" ON "XeroImportSession"("connectionId");

-- AddForeignKey
ALTER TABLE "XeroConnection" ADD CONSTRAINT "XeroConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XeroDocument" ADD CONSTRAINT "XeroDocument_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "XeroConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XeroDocument" ADD CONSTRAINT "XeroDocument_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XeroImportSession" ADD CONSTRAINT "XeroImportSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XeroImportSession" ADD CONSTRAINT "XeroImportSession_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "XeroConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
