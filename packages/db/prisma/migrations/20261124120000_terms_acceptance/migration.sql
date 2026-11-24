-- SPDX-License-Identifier: AGPL-3.0-only
ALTER TABLE "user"
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "termsAcceptedVersion" TEXT;
