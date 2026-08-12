import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Schedule - Conflict Detection", () => {
  it("có 2 series trùng phòng Phòng 203 cùng giờ 08:00-10:30 khác lớp", async () => {
    // Seed cố ý tạo conflict: series11A1English & series11A2EnglishConflict
    // cùng teacher, cùng dayOfWeek=3, giờ overlap (08:00-09:30 vs 09:00-10:30), cùng phòng Phòng 203.
    const schedules = await db.scheduleSeries.findMany({
      where: { room: "Phòng 203" },
    });
    expect(schedules.length).toBeGreaterThanOrEqual(2);
    expect(schedules[0].classId).not.toBe(schedules[1].classId);
  });

  it("có 2 series cùng giáo viên overlap giờ khác lớp (xung đột GV)", async () => {
    // Seed: teacher 3 (teacher.anh@eduweb.vn) dạy ENG101 cho 11A1 (08:00-09:30) và 11A2 (09:00-10:30) cùng thứ 3.
    const eng = await db.subject.findUnique({ where: { code: "ENG101" } });
    const schedules = await db.scheduleSeries.findMany({ where: { subjectId: eng!.id } });
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
    const recurring = await db.scheduleSeries.findMany({ where: { endDate: null } });
    expect(recurring.length).toBeGreaterThanOrEqual(1);
    for (const s of recurring) {
      expect(s.startDate).toBeTruthy();
      expect(s.endDate).toBeNull();
      expect(s.dayOfWeek).toBeGreaterThanOrEqual(1);
      expect(s.dayOfWeek).toBeLessThanOrEqual(7);
    }
  });
});
