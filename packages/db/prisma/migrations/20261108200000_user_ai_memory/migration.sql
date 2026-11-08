-- CreateTable
CREATE TABLE IF NOT EXISTS "user_ai_memory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_ai_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_ai_memory_userId_createdAt_idx" ON "user_ai_memory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "user_ai_memory" ADD CONSTRAINT "user_ai_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
