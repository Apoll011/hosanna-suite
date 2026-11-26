-- SPDX-License-Identifier: AGPL-3.0-only
-- CreateTable
CREATE TABLE "organizationAgreement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agreementType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedByUserId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "organizationAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizationAgreement_organizationId_agreementType_version_key" ON "organizationAgreement"("organizationId", "agreementType", "version");

-- CreateIndex
CREATE INDEX "organizationAgreement_organizationId_idx" ON "organizationAgreement"("organizationId");

-- CreateIndex
CREATE INDEX "organizationAgreement_acceptedByUserId_idx" ON "organizationAgreement"("acceptedByUserId");

-- AddForeignKey
ALTER TABLE "organizationAgreement" ADD CONSTRAINT "organizationAgreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizationAgreement" ADD CONSTRAINT "organizationAgreement_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
