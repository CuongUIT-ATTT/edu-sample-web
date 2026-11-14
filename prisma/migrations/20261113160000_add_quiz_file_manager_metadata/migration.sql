-- Add columns without defaults first: existing quizzes retain unknown metadata as NULL.
BEGIN;

ALTER TABLE "Quiz"
    ADD COLUMN "createdAt" TIMESTAMP(3),
    ADD COLUMN "updatedAt" TIMESTAMP(3),
    ADD COLUMN "createdById" TEXT;

-- SET DEFAULT does not backfill existing rows. New SQL/Prisma inserts get timestamps.
ALTER TABLE "Quiz"
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Quiz_createdAt_idx" ON "Quiz"("createdAt");
CREATE INDEX "Quiz_updatedAt_idx" ON "Quiz"("updatedAt");
CREATE INDEX "Quiz_createdById_createdAt_idx" ON "Quiz"("createdById", "createdAt");
CREATE INDEX "Quiz_createdById_updatedAt_idx" ON "Quiz"("createdById", "updatedAt");

ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
