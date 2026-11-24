-- DropForeignKey
ALTER TABLE "organizationAgreement" DROP CONSTRAINT "organizationAgreement_organizationId_fkey";

-- DropIndex
DROP INDEX "organizationAgreement_organizationId_agreementType_version_key";

-- AlterTable
ALTER TABLE "organizationAgreement" ADD COLUMN     "deletedOrgId" TEXT,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "organizationAgreement_deletedOrgId_idx" ON "organizationAgreement"("deletedOrgId");

-- AddForeignKey
ALTER TABLE "organizationAgreement" ADD CONSTRAINT "organizationAgreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
