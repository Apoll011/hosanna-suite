/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,agreementType,version]` on the table `organizationAgreement` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "organizationAgreement" DROP CONSTRAINT "organizationAgreement_acceptedByUserId_fkey";

-- AlterTable
ALTER TABLE "organizationAgreement" ALTER COLUMN "acceptedByUserId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "organizationAgreement_organizationId_agreementType_version_key" ON "organizationAgreement"("organizationId", "agreementType", "version");

-- AddForeignKey
ALTER TABLE "organizationAgreement" ADD CONSTRAINT "organizationAgreement_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
