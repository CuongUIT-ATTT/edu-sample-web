-- Giao một đề quiz cho nhiều lớp, có thể override thời gian mở/đóng theo từng lớp.
CREATE TABLE "QuizClassAssignment" (
  "id" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "deadlineOverride" TIMESTAMP(3),
  "startsAtOverride" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuizClassAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuizClassAssignment_quizId_classId_key" ON "QuizClassAssignment"("quizId", "classId");
CREATE INDEX "QuizClassAssignment_quizId_idx" ON "QuizClassAssignment"("quizId");
CREATE INDEX "QuizClassAssignment_classId_idx" ON "QuizClassAssignment"("classId");

ALTER TABLE "QuizClassAssignment" ADD CONSTRAINT "QuizClassAssignment_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuizClassAssignment" ADD CONSTRAINT "QuizClassAssignment_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill dữ liệu legacy: mỗi quiz đang gắn 1 classId được chuyển thành 1 assignment.
-- deadlineOverride copy từ Quiz.deadline để giữ nguyên hành vi deadline cũ cho lớp đó.
INSERT INTO "QuizClassAssignment" ("id", "quizId", "classId", "deadlineOverride", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "classId", "deadline", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Quiz"
WHERE "classId" IS NOT NULL
ON CONFLICT ("quizId", "classId") DO NOTHING;
