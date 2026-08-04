-- Redesign lịch học: Master + Exception (Google Calendar model)
-- Chỉ THÊM bảng mới + đổi HomeworkSubmission. KHÔNG drop bảng cũ (tránh mất data).

-- 1. Enum ExceptionStatus
DO $$ BEGIN
  CREATE TYPE "ExceptionStatus" AS ENUM ('MODIFIED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Bảng ScheduleSeries
CREATE TABLE "ScheduleSeries" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "room" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "materials" TEXT,
  "homework" TEXT,
  "homeworkDueDate" TIMESTAMP(3),
  "homeworkQuizId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScheduleSeries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduleSeries_classId_dayOfWeek_idx" ON "ScheduleSeries"("classId", "dayOfWeek");
CREATE INDEX "ScheduleSeries_teacherId_dayOfWeek_idx" ON "ScheduleSeries"("teacherId", "dayOfWeek");
CREATE INDEX "ScheduleSeries_room_dayOfWeek_idx" ON "ScheduleSeries"("room", "dayOfWeek");
CREATE INDEX "ScheduleSeries_startDate_idx" ON "ScheduleSeries"("startDate");

-- 3. Bảng ScheduleException
CREATE TABLE "ScheduleException" (
  "id" TEXT NOT NULL,
  "seriesId" TEXT NOT NULL,
  "originalDate" TIMESTAMP(3) NOT NULL,
  "status" "ExceptionStatus" NOT NULL,
  "classId" TEXT,
  "subjectId" TEXT,
  "teacherId" TEXT,
  "room" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "materials" TEXT,
  "homework" TEXT,
  "homeworkDueDate" TIMESTAMP(3),
  "homeworkQuizId" TEXT,

  CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleException_seriesId_originalDate_key" ON "ScheduleException"("seriesId", "originalDate");
CREATE INDEX "ScheduleException_seriesId_idx" ON "ScheduleException"("seriesId");
CREATE INDEX "ScheduleException_originalDate_idx" ON "ScheduleException"("originalDate");

-- 4. FK cho ScheduleSeries (Class, Subject, TeacherProfile, Quiz)
ALTER TABLE "ScheduleSeries" ADD CONSTRAINT "ScheduleSeries_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleSeries" ADD CONSTRAINT "ScheduleSeries_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleSeries" ADD CONSTRAINT "ScheduleSeries_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleSeries" ADD CONSTRAINT "ScheduleSeries_homeworkQuizId_fkey"
  FOREIGN KEY ("homeworkQuizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. FK cho ScheduleException → ScheduleSeries
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "ScheduleSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Đổi HomeworkSubmission: thêm seriesId + instanceDate, bỏ scheduleId cũ
-- (data hiện rỗng count=0 → an toàn không mất gì)
ALTER TABLE "HomeworkSubmission" DROP CONSTRAINT IF EXISTS "HomeworkSubmission_scheduleId_fkey";
ALTER TABLE "HomeworkSubmission" DROP CONSTRAINT IF EXISTS "HomeworkSubmission_scheduleId_studentId_key";
ALTER TABLE "HomeworkSubmission" DROP COLUMN IF EXISTS "scheduleId";
ALTER TABLE "HomeworkSubmission" ADD COLUMN "seriesId" TEXT NOT NULL;
ALTER TABLE "HomeworkSubmission" ADD COLUMN "instanceDate" TIMESTAMP(3) NOT NULL;

ALTER TABLE "HomeworkSubmission" ADD CONSTRAINT "HomeworkSubmission_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "ScheduleSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "HomeworkSubmission_seriesId_instanceDate_studentId_key"
  ON "HomeworkSubmission"("seriesId", "instanceDate", "studentId");
CREATE INDEX "HomeworkSubmission_seriesId_instanceDate_idx"
  ON "HomeworkSubmission"("seriesId", "instanceDate");
