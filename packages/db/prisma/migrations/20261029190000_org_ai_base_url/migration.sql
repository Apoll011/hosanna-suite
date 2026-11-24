-- SPDX-License-Identifier: AGPL-3.0-only
-- AlterTable
ALTER TABLE "org_ai_config" ADD COLUMN IF NOT EXISTS "baseUrl" TEXT;
