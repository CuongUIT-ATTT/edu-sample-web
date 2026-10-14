-- Optional controlled access for public quizzes: roster candidates, per-candidate
-- submitted-attempt limit, and a browser binding held as a server-side digest.
ALTER TABLE "Quiz"
  ADD COLUMN "candidateAccessRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "candidateMaxSubmissions" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "candidateBindingExpiryMode" TEXT NOT NULL DEFAULT 'HOURS',
  ADD COLUMN "candidateBindingHours" INTEGER;

CREATE TABLE "QuizCandidate" (
  "id" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "studentId" TEXT,
  "name" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "codeDigest" TEXT NOT NULL,
  "codeCiphertext" TEXT NOT NULL,
  "isRevoked" BOOLEAN NOT NULL DEFAULT false,
  "revokedAt" TIMESTAMP(3),
  "submittedCount" INTEGER NOT NULL DEFAULT 0,
  "bindingSecretDigest" TEXT,
  "bindingStartedAt" TIMESTAMP(3),
  "bindingExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuizCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuizCandidate_quizId_codeDigest_key"
  ON "QuizCandidate"("quizId", "codeDigest");
CREATE UNIQUE INDEX "QuizCandidate_quizId_studentId_key"
  ON "QuizCandidate"("quizId", "studentId");
CREATE INDEX "QuizCandidate_quizId_isRevoked_idx"
  ON "QuizCandidate"("quizId", "isRevoked");
CREATE INDEX "QuizCandidate_bindingExpiresAt_idx"
  ON "QuizCandidate"("bindingExpiresAt");

ALTER TABLE "QuizCandidate" ADD CONSTRAINT "QuizCandidate_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizCandidate" ADD CONSTRAINT "QuizCandidate_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuizSubmission" ADD COLUMN "candidateId" TEXT;
CREATE INDEX "QuizSubmission_candidateId_idx" ON "QuizSubmission"("candidateId");
ALTER TABLE "QuizSubmission" ADD CONSTRAINT "QuizSubmission_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "QuizCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuizAttempt" ADD COLUMN "candidateId" TEXT;
CREATE INDEX "QuizAttempt_candidateId_idx" ON "QuizAttempt"("candidateId");
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "QuizCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
