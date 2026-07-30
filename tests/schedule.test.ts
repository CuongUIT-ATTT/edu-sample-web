import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Schedule - Conflict Detection", () => {
  it("có 2 schedule trùng phòng P101 cùng giờ 10:30-12:00 khác lớp", async () => {
    const schedules = await db.schedule.findMany({
      where: { room: "P101", startTime: "10:30", endTime: "12:00" },
    });
    expect(schedules.length).toBeGreaterThanOrEqual(2);
    expect(schedules[0].classId).not.toBe(schedules[1].classId);
  });

  it("có 2 schedule cùng giáo viên trùng giờ 07:30-09:00 khác lớp", async () => {
    const schedules = await db.schedule.findMany({
      where: { startTime: "07:30", endTime: "09:00", dayOfWeek: 4 },
    });
    expect(schedules.length).toBeGreaterThanOrEqual(2);
    expect(schedules[0].teacherId).toBe(schedules[1].teacherId);
    expect(schedules[0].classId).not.toBe(schedules[1].classId);
  });

  it("recurring group rg-001 có 3 schedule đúng cấu trúc", async () => {
    const schedules = await db.schedule.findMany({
      where: { recurrenceGroupId: "rg-001" },
      orderBy: { date: "asc" },
    });
    expect(schedules).toHaveLength(3);
    expect(schedules[0].classId).toBe(schedules[1].classId);
    expect(schedules[0].teacherId).toBe(schedules[1].teacherId);
    expect(schedules[0].startTime).toBe(schedules[1].startTime);
  });
});
