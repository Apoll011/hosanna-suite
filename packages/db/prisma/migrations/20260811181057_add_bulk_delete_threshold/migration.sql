-- SPDX-License-Identifier: AGPL-3.0-only
-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "bulkDeleteThreshold" INTEGER NOT NULL DEFAULT 10;
