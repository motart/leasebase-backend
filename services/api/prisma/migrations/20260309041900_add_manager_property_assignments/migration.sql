-- CreateTable
CREATE TABLE "ManagerPropertyAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerPropertyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManagerPropertyAssignment_organizationId_userId_idx" ON "ManagerPropertyAssignment"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "ManagerPropertyAssignment_organizationId_propertyId_idx" ON "ManagerPropertyAssignment"("organizationId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerPropertyAssignment_organizationId_userId_propertyId_key" ON "ManagerPropertyAssignment"("organizationId", "userId", "propertyId");

-- AddForeignKey
ALTER TABLE "ManagerPropertyAssignment" ADD CONSTRAINT "ManagerPropertyAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerPropertyAssignment" ADD CONSTRAINT "ManagerPropertyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerPropertyAssignment" ADD CONSTRAINT "ManagerPropertyAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
