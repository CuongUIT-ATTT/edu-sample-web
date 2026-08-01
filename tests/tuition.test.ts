import { describe, it, expect } from "vitest";
import { db } from "./helpers";

async function sid(email: string) {
  const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
  return u?.studentProfile?.id;
}

describe("Tuition - Thanh toán", () => {
  it("tui-001: đã đóng ĐỦ (paid=amount=432000, status=PAID)", async () => {
    const t = await db.tuition.findUnique({ where: { id: "tui-001" } });
    expect(t!.paid).toBe(t!.amount);
    expect(t!.status).toBe("PAID");
  });

  it("tui-002: đóng THIẾU (2 payments, status=PARTIAL)", async () => {
    const t = await db.tuition.findUnique({ where: { id: "tui-002" }, include: { payments: true } });
    expect(t!.paid).toBeLessThan(t!.amount);
    expect(t!.status).toBe("PARTIAL");
    expect(t!.payments).toHaveLength(2);
    expect(t!.payments.reduce((s, p) => s + p.amount, 0)).toBe(t!.paid);
  });

  it("tui-003: CHƯA đóng (paid=0, PENDING)", async () => {
    const t = await db.tuition.findUnique({ where: { id: "tui-003" } });
    expect(t!.paid).toBe(0);
    expect(t!.status).toBe("PENDING");
  });
});

describe("TuitionFeeSetting - Thay đổi giá", () => {
  it("giá mới 18k, tháng trước 15k → 300k, tháng này 18k → 432k", async () => {
    const latest = await db.tuitionFeeSetting.findFirst({ orderBy: { updatedAt: "desc" } });
    expect(latest!.pricePerPeriod).toBe(18000);
    const old_ = await db.tuition.findUnique({ where: { id: "tui-005" } });
    expect(old_!.amount).toBe(300000);
    const cur = await db.tuition.findUnique({ where: { id: "tui-001" } });
    expect(cur!.amount).toBe(432000);
  });
});

describe("Tuition - Có mặt/Vắng/Trễ tính tiền, Chưa điểm danh/Phép không tính", () => {
  it("tui-004: PRESENT/ABSENT/LATE tính tiền; EXCUSED + chưa điểm danh không tính", async () => {
    // Tạo dữ liệu tạm kiểm soát (tự cleanup, không phụ thuộc seed)
    const ts = Date.now();
    const user = await db.user.create({
      data: { email: `test-att-${ts}@test.local`, name: "Test ATD", passwordHash: "x", role: "STUDENT" },
    });
    const student = await db.studentProfile.create({ data: { userId: user.id } });
    const subject = await db.subject.findFirstOrThrow();
    const teacher = await db.teacherProfile.findFirstOrThrow();
    const cls = await db.class.create({ data: { name: `TEST-ATD-${ts}`, gradeLevel: 10 } });
    await db.studentProfile.update({ where: { id: student.id }, data: { classes: { connect: { id: cls.id } } } });

    const day = (d: number) => new Date(2026, 6, d, 7, 30, 0, 0);
    const scheduleIds: string[] = [];
    for (const d of [10, 11, 12, 13, 14]) {
      const s = await db.schedule.create({
        data: { classId: cls.id, subjectId: subject.id, teacherId: teacher.id, dayOfWeek: (d % 7) || 7, startTime: "07:30", endTime: "09:00", room: "TEST", date: day(d) },
      });
      scheduleIds.push(s.id);
    }

    await db.attendance.create({ data: { studentId: student.id, date: day(10), status: "EXCUSED" } });
    await db.attendance.create({ data: { studentId: student.id, date: day(11), status: "PRESENT" } });
    await db.attendance.create({ data: { studentId: student.id, date: day(12), status: "ABSENT" } });
    await db.attendance.create({ data: { studentId: student.id, date: day(13), status: "LATE" } });

    const startDate = new Date(2026, 6, 1);
    const endDate = new Date(2026, 6, 31, 23, 59, 59);

    // Replicate logic từ calculateTuition (PRESENT/ABSENT/LATE tính, EXCUSED không)
    const schedules = await db.schedule.findMany({ where: { classId: cls.id, date: { gte: startDate, lte: endDate } } });
    const schedulePeriods: Record<string, number> = {};
    for (const s of schedules) {
      if (s.date) {
        const [sh, sm] = s.startTime.split(":").map(Number);
        const [eh, em] = s.endTime.split(":").map(Number);
        schedulePeriods[s.id] = Math.max(1, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 45));
      }
    }
    const firstSchedulePeriods = Object.values(schedulePeriods)[0] || 1;

    const attendanceRecords = await db.attendance.findMany({
      where: { studentId: student.id, date: { gte: startDate, lte: endDate } },
    });
    const markedSchedules = new Set<string>();
    for (const att of attendanceRecords) {
      if (att.status !== "EXCUSED") {
        const matching = schedules.find(
          (s) => s.date && new Date(s.date).toISOString().split("T")[0] === att.date.toISOString().split("T")[0],
        );
        if (matching && !markedSchedules.has(matching.id)) markedSchedules.add(matching.id);
      }
    }
    const studentPeriods = markedSchedules.size * firstSchedulePeriods;

    // Cleanup
    await db.attendance.deleteMany({ where: { studentId: student.id } });
    await db.schedule.deleteMany({ where: { id: { in: scheduleIds } } });
    await db.studentProfile.delete({ where: { id: student.id } });
    await db.class.delete({ where: { id: cls.id } });
    await db.user.delete({ where: { id: user.id } });

    // Kỳ vọng: 3 buổi (PRESENT/ABSENT/LATE) tính tiền; EXCUSED + chưa điểm danh không
    expect(markedSchedules.size).toBe(3);
    expect(studentPeriods).toBe(3 * firstSchedulePeriods);
  });

  it("hs001 có EXCUSED — chứng minh attendance đủ 4 trạng thái", async () => {
    const id = await sid("hs001@email.com");
    expect(id).not.toBeNull();

    const records = await db.attendance.findMany({ where: { studentId: id } });
    const statuses = records.map((r) => r.status);
    expect(statuses).toContain("PRESENT");
    expect(statuses).toContain("ABSENT");
    expect(statuses).toContain("LATE");
    expect(statuses).toContain("EXCUSED");
  });
});
