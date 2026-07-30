import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Attendance - Edge Cases", () => {
  async function getStudentId(email: string) {
    const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
    return u?.studentProfile?.id;
  }

  it("hs001 có đủ 4 trạng thái PRESENT/ABSENT/LATE/EXCUSED", async () => {
    const sid = await getStudentId("hs001@email.com");
    const records = await db.attendance.findMany({ where: { studentId: sid }, orderBy: { date: "asc" } });
    const statuses = records.map((r) => r.status);
    expect(statuses).toContain("PRESENT");
    expect(statuses).toContain("ABSENT");
    expect(statuses).toContain("LATE");
    expect(statuses).toContain("EXCUSED");
  });

  it("hs002 có >=3 ABSENT liên tiếp", async () => {
    const sid = await getStudentId("hs002@email.com");
    const records = await db.attendance.findMany({ where: { studentId: sid }, orderBy: { date: "asc" } });
    expect(records.length).toBeGreaterThanOrEqual(3);
    expect(records.every((r) => r.status === "ABSENT")).toBe(true);
  });

  it("buổi hôm nay chưa có attendance", async () => {
    const sid = await getStudentId("hs001@email.com");
    const today = new Date();
    const count = await db.attendance.count({
      where: { studentId: sid, date: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } },
    });
    expect(count).toBe(0);
  });
});
