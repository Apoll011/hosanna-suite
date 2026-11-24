-- SPDX-License-Identifier: AGPL-3.0-only
-- CreateIndex
CREATE INDEX "invitation_email_organizationId_idx" ON "invitation"("email", "organizationId");
