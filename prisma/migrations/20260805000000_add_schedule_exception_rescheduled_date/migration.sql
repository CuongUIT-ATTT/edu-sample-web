-- Thêm cột rescheduledDate vào ScheduleException (dời ngày 1 buổi). Nullable, không phá data.
ALTER TABLE "ScheduleException" ADD COLUMN "rescheduledDate" TIMESTAMP(3);
