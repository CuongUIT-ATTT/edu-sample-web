import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Schedule - Conflict Detection", () => {
  it("có 2 series trùng phòng P101 cùng giờ 10:30-12:00 khác lớp", async () => {
    const schedules = await db.scheduleSeries.findMany({
      where: { room: "P101", startTime: "10:30", endTime: "12:00" },
    });
    expect(schedules.length).toBeGreaterThanOrEqual(2);
    expect(schedules[0].classId).not.toBe(schedules[1].classId);
  });

  it("có 2 series cùng giáo viên trùng giờ 07:30-09:00 khác lớp", async () => {
    const schedules = await db.scheduleSeries.findMany({
      where: { startTime: "07:30", endTime: "09:00" },
    });
    // Ít nhất 2 series của cùng 1 teacher nhưng khác lớp
    const byTeacher = new Map<string, string[]>();
    for (const s of schedules) {
      const arr = byTeacher.get(s.teacherId) || [];
      arr.push(s.classId);
      byTeacher.set(s.teacherId, arr);
    }
    let found = false;
    for (const classes of byTeacher.values()) {
      if (classes.length >= 2 && new Set(classes).size >= 2) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("có series lặp vô hạn (endDate null) đúng cấu trúc", async () => {
    const recurring = await db.scheduleSeries.findMany({
      where: { endDate: null },
    });
    expect(recurring.length).toBeGreaterThanOrEqual(1);
    // Mỗi series vô hạn phải có startDate, không có endDate
    for (const s of recurring) {
      expect(s.startDate).toBeTruthy();
      expect(s.endDate).toBeNull();
      expect(s.dayOfWeek).toBeGreaterThanOrEqual(1);
      expect(s.dayOfWeek).toBeLessThanOrEqual(7);
    }
  });
});
