-- Unified notification system: PushDevice registry, preferences, delivery log.

CREATE TABLE "push_device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sessionId" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'unknown',
    "appId" TEXT NOT NULL DEFAULT 'unknown',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_device_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_device_token_key" ON "push_device"("token");
CREATE INDEX "push_device_userId_enabled_idx" ON "push_device"("userId", "enabled");
CREATE INDEX "push_device_sessionId_idx" ON "push_device"("sessionId");

ALTER TABLE "push_device" ADD CONSTRAINT "push_device_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notification_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT,
    "category" TEXT,
    "inbox" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_preference_userId_idx" ON "notification_preference"("userId");
CREATE INDEX "notification_preference_userId_type_idx" ON "notification_preference"("userId", "type");
CREATE INDEX "notification_preference_userId_category_idx" ON "notification_preference"("userId", "category");

ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notification_delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_delivery_userId_createdAt_idx" ON "notification_delivery"("userId", "createdAt");
CREATE INDEX "notification_delivery_type_channel_createdAt_idx" ON "notification_delivery"("type", "channel", "createdAt");

ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing session FCM tokens into PushDevice (notify=true only).
INSERT INTO "push_device" ("id", "userId", "token", "sessionId", "platform", "appId", "enabled", "lastSeenAt", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  s."userId",
  s."fcm",
  s."id",
  'unknown',
  'musician',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "session" s
WHERE s."fcm" IS NOT NULL
  AND s."notify" = true
  AND NOT EXISTS (
    SELECT 1 FROM "push_device" d WHERE d."token" = s."fcm"
  );
