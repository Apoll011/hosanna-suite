-- SPDX-License-Identifier: AGPL-3.0-only
-- AlterTable
ALTER TABLE "session" ADD COLUMN     "fcm" TEXT,
ADD COLUMN     "notify" BOOLEAN NOT NULL DEFAULT true;
