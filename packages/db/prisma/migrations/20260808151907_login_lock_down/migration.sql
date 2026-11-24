-- SPDX-License-Identifier: AGPL-3.0-only
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "loginFailedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loginLockedUntil" TIMESTAMP(3);
