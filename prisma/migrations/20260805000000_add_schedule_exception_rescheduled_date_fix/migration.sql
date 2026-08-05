-- Fix migration: thêm cột "rescheduledDate" nếu chưa tồn tại (idempotent).
-- Bản migration 20260805000000 gốc bị ghi nhận "applied" nhưng cột không được tạo
-- (môi trường sync bằng db push trên schema cũ) → mọi query Prisma kéo ScheduleException fail
-- với "column rescheduledDate does not exist", gây ra "Lỗi tải sự kiện" và "lỗi hệ thống khi xếp lịch".
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ScheduleException' AND column_name = 'rescheduledDate'
  ) THEN
    ALTER TABLE "ScheduleException" ADD COLUMN "rescheduledDate" TIMESTAMP(3);
  END IF;
END $$;

-- Sửa data lỗi: series có endDate < startDate (do rút ngắn endDate về sát startDate trong updateSchedule
-- dùng addDaysUtc(cutoverDate, -1) → endDate trước startDate 1 ngày → expandSeriesToInstances không sinh buổi).
UPDATE "ScheduleSeries"
SET "endDate" = "startDate"
WHERE "endDate" IS NOT NULL AND "endDate" < "startDate";
