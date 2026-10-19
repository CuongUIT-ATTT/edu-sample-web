-- Candidate exam codes now belong to an assigned internal class. Existing public
-- candidate rows remain nullable for backwards-compatible display and revocation.
ALTER TABLE "QuizCandidate" ADD COLUMN "classId" TEXT;

-- Existing records can be safely associated only when the quiz has one legacy
-- class. Multi-class legacy rows are intentionally left unassigned.
UPDATE "QuizCandidate" AS candidate
SET "classId" = quiz."classId"
FROM "Quiz" AS quiz
WHERE candidate."quizId" = quiz."id"
  AND candidate."classId" IS NULL
  AND quiz."classId" IS NOT NULL;

DROP INDEX "QuizCandidate_quizId_studentId_key";
CREATE UNIQUE INDEX "QuizCandidate_quizId_classId_studentId_key"
  ON "QuizCandidate"("quizId", "classId", "studentId");
CREATE INDEX "QuizCandidate_quizId_classId_idx"
  ON "QuizCandidate"("quizId", "classId");

ALTER TABLE "QuizCandidate" ADD CONSTRAINT "QuizCandidate_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
