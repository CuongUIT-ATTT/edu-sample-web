-- ============================================================================
-- Migration: 20261111000000_grade_quiz_submission_and_candidate_uniqueness
-- Purpose:
--   1. Deterministic preflight deduplication for QuizCandidate across nullable combinations.
--   2. Ensure compound unique constraint on QuizCandidate(quizId, classId, studentId).
--   3. Add partial unique index on QuizCandidate(quizId, studentId) WHERE classId IS NULL.
--   4. Link Grade to QuizSubmission via quizSubmissionId (TEXT UNIQUE) with CASCADE delete.
--      Preserves all historical Grade rows (NULL quizSubmissionId).
-- ============================================================================

-- 1. Preflight & Deterministic Deduplication for QuizCandidate
DO $$
DECLARE
  r RECORD;
  v_survivor_id TEXT;
BEGIN
  -- A. Deduplicate (quizId, classId, studentId) where classId IS NOT NULL AND studentId IS NOT NULL
  FOR r IN
    SELECT "quizId", "classId", "studentId"
    FROM "QuizCandidate"
    WHERE "classId" IS NOT NULL AND "studentId" IS NOT NULL
    GROUP BY "quizId", "classId", "studentId"
    HAVING COUNT(*) > 1
  LOOP
    -- Canonical survivor: highest submittedCount, active (isRevoked = false), newest updatedAt/createdAt/id
    SELECT "id" INTO v_survivor_id
    FROM "QuizCandidate"
    WHERE "quizId" = r."quizId"
      AND "classId" = r."classId"
      AND "studentId" = r."studentId"
    ORDER BY "submittedCount" DESC, "isRevoked" ASC, "updatedAt" DESC, "createdAt" DESC, "id" DESC
    LIMIT 1;

    -- Re-link submissions and attempts to survivor
    UPDATE "QuizSubmission"
    SET "candidateId" = v_survivor_id
    WHERE "candidateId" IN (
      SELECT "id" FROM "QuizCandidate"
      WHERE "quizId" = r."quizId"
        AND "classId" = r."classId"
        AND "studentId" = r."studentId"
        AND "id" <> v_survivor_id
    );

    UPDATE "QuizAttempt"
    SET "candidateId" = v_survivor_id
    WHERE "candidateId" IN (
      SELECT "id" FROM "QuizCandidate"
      WHERE "quizId" = r."quizId"
        AND "classId" = r."classId"
        AND "studentId" = r."studentId"
        AND "id" <> v_survivor_id
    );

    DELETE FROM "QuizCandidate"
    WHERE "quizId" = r."quizId"
      AND "classId" = r."classId"
      AND "studentId" = r."studentId"
      AND "id" <> v_survivor_id;
  END LOOP;

  -- B. Deduplicate (quizId, studentId) where classId IS NULL AND studentId IS NOT NULL
  FOR r IN
    SELECT "quizId", "studentId"
    FROM "QuizCandidate"
    WHERE "classId" IS NULL AND "studentId" IS NOT NULL
    GROUP BY "quizId", "studentId"
    HAVING COUNT(*) > 1
  LOOP
    SELECT "id" INTO v_survivor_id
    FROM "QuizCandidate"
    WHERE "quizId" = r."quizId"
      AND "classId" IS NULL
      AND "studentId" = r."studentId"
    ORDER BY "submittedCount" DESC, "isRevoked" ASC, "updatedAt" DESC, "createdAt" DESC, "id" DESC
    LIMIT 1;

    UPDATE "QuizSubmission"
    SET "candidateId" = v_survivor_id
    WHERE "candidateId" IN (
      SELECT "id" FROM "QuizCandidate"
      WHERE "quizId" = r."quizId"
        AND "classId" IS NULL
        AND "studentId" = r."studentId"
        AND "id" <> v_survivor_id
    );

    UPDATE "QuizAttempt"
    SET "candidateId" = v_survivor_id
    WHERE "candidateId" IN (
      SELECT "id" FROM "QuizCandidate"
      WHERE "quizId" = r."quizId"
        AND "classId" IS NULL
        AND "studentId" = r."studentId"
        AND "id" <> v_survivor_id
    );

    DELETE FROM "QuizCandidate"
    WHERE "quizId" = r."quizId"
      AND "classId" IS NULL
      AND "studentId" = r."studentId"
      AND "id" <> v_survivor_id;
  END LOOP;
END $$;

-- 2. Ensure compound unique index exists for (quizId, classId, studentId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'QuizCandidate' AND indexname = 'QuizCandidate_quizId_classId_studentId_key'
  ) THEN
    CREATE UNIQUE INDEX "QuizCandidate_quizId_classId_studentId_key"
      ON "QuizCandidate"("quizId", "classId", "studentId");
  END IF;
END $$;

-- 3. Add partial unique index for unassigned student candidates (classId IS NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'QuizCandidate' AND indexname = 'QuizCandidate_quizId_studentId_unassigned_key'
  ) THEN
    CREATE UNIQUE INDEX "QuizCandidate_quizId_studentId_unassigned_key"
      ON "QuizCandidate"("quizId", "studentId")
      WHERE "classId" IS NULL AND "studentId" IS NOT NULL;
  END IF;
END $$;

-- 4. Add quizSubmissionId column to Grade (idempotent, nullable to preserve all historical records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Grade' AND column_name = 'quizSubmissionId'
  ) THEN
    ALTER TABLE "Grade" ADD COLUMN "quizSubmissionId" TEXT;
  END IF;
END $$;

-- 5. Add unique index on Grade(quizSubmissionId) for 1-1 relationship and retry idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'Grade' AND indexname = 'Grade_quizSubmissionId_key'
  ) THEN
    CREATE UNIQUE INDEX "Grade_quizSubmissionId_key" ON "Grade"("quizSubmissionId");
  END IF;
END $$;

-- 6. Add foreign key constraint linking Grade to QuizSubmission with CASCADE delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Grade' AND constraint_name = 'Grade_quizSubmissionId_fkey'
  ) THEN
    ALTER TABLE "Grade"
      ADD CONSTRAINT "Grade_quizSubmissionId_fkey"
      FOREIGN KEY ("quizSubmissionId") REFERENCES "QuizSubmission"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
