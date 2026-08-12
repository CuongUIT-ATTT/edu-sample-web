-- Xáo trộn câu hỏi & đáp án + chống gian lận (mã đề server-side)
-- 1. Quiz: cột shuffleQuestions (bật/tắt xáo trộn từng đề)
ALTER TABLE "Quiz" ADD COLUMN "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true;

-- 2. Bảng QuizAttempt — 1 lượt làm bài = 1 mã đề xáo trộn (server là nguồn chân lý)
CREATE TABLE "QuizAttempt" (
  "id" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "studentId" TEXT,
  "guestName" TEXT,
  "examCode" TEXT NOT NULL,
  "layout" JSONB NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- 3. Indexes
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");
CREATE INDEX "QuizAttempt_examCode_idx" ON "QuizAttempt"("examCode");

-- 4. FK cho QuizAttempt
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. QuizSubmission: cột attemptId (liên kết lượt làm bài)
ALTER TABLE "QuizSubmission" ADD COLUMN "attemptId" TEXT;
CREATE UNIQUE INDEX "QuizSubmission_attemptId_key" ON "QuizSubmission"("attemptId");
ALTER TABLE "QuizSubmission" ADD CONSTRAINT "QuizSubmission_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
