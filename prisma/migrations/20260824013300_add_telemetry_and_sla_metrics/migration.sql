-- AlterTable: Add SLA and milestone timestamps to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "actualPrepTimeSeconds" INTEGER,
ADD COLUMN IF NOT EXISTS "actualTotalTimeSeconds" INTEGER,
ADD COLUMN IF NOT EXISTS "wasSlaBreached" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

-- AlterTable: Add cooking timestamps to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "prepTimeSeconds" INTEGER;

-- CreateTable: OrderTelemetry for AI & Analytics
CREATE TABLE IF NOT EXISTS "OrderTelemetry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "hourOfDay" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "activeOrdersCountAtCreation" INTEGER NOT NULL DEFAULT 0,
    "preparingOrdersCountAtCreation" INTEGER NOT NULL DEFAULT 0,
    "totalItemQuantity" INTEGER NOT NULL DEFAULT 1,
    "uniqueItemCount" INTEGER NOT NULL DEFAULT 1,
    "hasModifiers" BOOLEAN NOT NULL DEFAULT false,
    "channelSource" TEXT NOT NULL DEFAULT 'QR_DINE_IN',

    CONSTRAINT "OrderTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OrderTelemetry_orderId_key" ON "OrderTelemetry"("orderId");
CREATE INDEX IF NOT EXISTS "OrderTelemetry_tenantId_idx" ON "OrderTelemetry"("tenantId");
CREATE INDEX IF NOT EXISTS "OrderTelemetry_createdAt_idx" ON "OrderTelemetry"("createdAt");

-- AddForeignKey
ALTER TABLE "OrderTelemetry" DROP CONSTRAINT IF EXISTS "OrderTelemetry_orderId_fkey";
ALTER TABLE "OrderTelemetry" ADD CONSTRAINT "OrderTelemetry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderTelemetry" DROP CONSTRAINT IF EXISTS "OrderTelemetry_tenantId_fkey";
ALTER TABLE "OrderTelemetry" ADD CONSTRAINT "OrderTelemetry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
