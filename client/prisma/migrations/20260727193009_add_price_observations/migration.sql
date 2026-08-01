-- CreateTable
CREATE TABLE "PriceObservation" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "quotedUnitPrice" DOUBLE PRECISION NOT NULL,
    "marketUnitPriceEstimate" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "quoteId" TEXT,
    "organizationId" TEXT,
    "rfqSupplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceObservation_description_idx" ON "PriceObservation"("description");

-- CreateIndex
CREATE INDEX "PriceObservation_quoteId_idx" ON "PriceObservation"("quoteId");

-- CreateIndex
CREATE INDEX "PriceObservation_organizationId_idx" ON "PriceObservation"("organizationId");

-- CreateIndex
CREATE INDEX "PriceObservation_rfqSupplierId_idx" ON "PriceObservation"("rfqSupplierId");

-- AddForeignKey
ALTER TABLE "PriceObservation" ADD CONSTRAINT "PriceObservation_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceObservation" ADD CONSTRAINT "PriceObservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceObservation" ADD CONSTRAINT "PriceObservation_rfqSupplierId_fkey" FOREIGN KEY ("rfqSupplierId") REFERENCES "RfqSupplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
