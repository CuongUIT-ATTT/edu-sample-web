import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Attendance - Edge Cases", () => {
  async function getStudentId(email: string) {
    const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
    return u?.studentProfile?.id;
  }

  it("student1 (10A1) có 3 buổi ABSENT liên tiếp", async () => {
    const sid = await getStudentId("student1@eduweb.vn");
    const records = await db.attendance.findMany({ where: { studentId: sid }, orderBy: { date: "asc" } });
    expect(records.length).toBeGreaterThanOrEqual(3);
    expect(records.slice(0, 3).every((r) => r.status === "ABSENT")).toBe(true);
  });

  it("student21 (12A1) có buổi EXCUSED (nghỉ có phép)", async () => {
    const sid = await getStudentId("student21@eduweb.vn");
    const records = await db.attendance.findMany({ where: { studentId: sid } });
    expect(records.map((r) => r.status)).toContain("EXCUSED");
  });

  it("buổi hôm nay chưa có attendance", async () => {
    const sid = await getStudentId("student1@eduweb.vn");
    const today = new Date();
    const count = await db.attendance.count({
      where: { studentId: sid, date: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } },
    });
    expect(count).toBe(0);
  });
});
