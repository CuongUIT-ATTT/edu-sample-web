import { describe, it, expect } from "vitest";
import { db } from "./helpers";
import { expandSeriesToInstances, dateToUtcStr, jsDayToDow, toLocalDateStr } from "@/lib/schedule-expand";

async function sid(email: string) {
  const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
  return u?.studentProfile?.id;
}

describe("Tuition - Thanh toán", () => {
  // Tuition không dùng ID cố định trong seed mới → truy vấn theo (student, class, month, year).
  async function tuitionOf(studentEmail: string, month: number, year: number) {
    const u = await db.user.findUnique({ where: { email: studentEmail }, include: { studentProfile: true } });
    const studentId = u?.studentProfile?.id;
    const cls = await db.class.findFirstOrThrow({ where: { students: { some: { id: studentId } } } });
    return db.tuition.findFirst({ where: { studentId, classId: cls.id, month, year }, include: { payments: true } });
  }

  it("student2: Tuition tháng 1 đóng THIẾU (paid=60000 < amount=120000, PARTIAL)", async () => {
    const t = await tuitionOf("student2@eduweb.vn", 1, 2026);
    expect(t).not.toBeNull();
    expect(t!.periods).toBe(8);
    expect(t!.amount).toBe(120000);
    expect(t!.paid).toBe(60000);
    expect(t!.status).toBe("PARTIAL");
  });

  it("student2 có StudentCredit dương (dư tiết)", async () => {
    const u = await db.user.findUnique({ where: { email: "student2@eduweb.vn" }, include: { studentProfile: true } });
    const studentId = u?.studentProfile?.id;
    const cls = await db.class.findFirstOrThrow({ where: { students: { some: { id: studentId } } } });
    const credit = await db.studentCredit.findUnique({ where: { studentId_classId: { studentId, classId: cls.id } } });
    expect(credit).not.toBeNull();
    expect(credit!.credit).toBeGreaterThan(0);
  });
});

describe("TuitionFeeSetting - Giá tiết", () => {
  it("giá mỗi tiết = 15k (tuition tháng 2 của student4: 8 tiết → 120000)", async () => {
    const u = await db.user.findUnique({ where: { email: "student4@eduweb.vn" }, include: { studentProfile: true } });
    const studentId = u?.studentProfile?.id;
    const cls = await db.class.findFirstOrThrow({ where: { students: { some: { id: studentId } } } });
    const t = await db.tuition.findFirst({ where: { studentId, classId: cls.id, month: 2, year: 2026 } });
    expect(t).not.toBeNull();
    expect(t!.periods).toBe(8);
    expect(t!.amount).toBe(8 * 15000);
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
    // Series one-off (startDate = endDate = UTC midnight; dayOfWeek khớp ngày) — giống prisma/seed.ts.
    const utcDay = (d: number) => new Date(Date.UTC(2026, 6, d));
    for (const d of [10, 11, 12, 13, 14]) {
      await db.scheduleSeries.create({
        data: {
          classId: cls.id, subjectId: subject.id, teacherId: teacher.id,
          dayOfWeek: jsDayToDow(utcDay(d).getUTCDay()),
          startTime: "07:30", endTime: "09:00", room: "TEST",
          startDate: utcDay(d), endDate: utcDay(d),
        },
      });
    }

    await db.attendance.create({ data: { studentId: student.id, date: day(10), status: "EXCUSED" } });
    await db.attendance.create({ data: { studentId: student.id, date: day(11), status: "PRESENT" } });
    await db.attendance.create({ data: { studentId: student.id, date: day(12), status: "ABSENT" } });
    await db.attendance.create({ data: { studentId: student.id, date: day(13), status: "LATE" } });

    const startDate = new Date(2026, 6, 1);
    const endDate = new Date(2026, 6, 31, 23, 59, 59);

    // Replicate logic mới của calculateTuition (expand ScheduleSeries → instances; PRESENT/ABSENT/LATE tính, EXCUSED không)
    const series = await db.scheduleSeries.findMany({ where: { classId: cls.id }, include: { exceptions: true } });
    const instances = series.flatMap((s) => expandSeriesToInstances(s, s.exceptions, new Date(Date.UTC(2026, 6, 1)), new Date(Date.UTC(2026, 6, 31))));
    const schedulePeriods: Record<string, number> = {};
    for (const inst of instances) {
      const [sh, sm] = inst.startTime.split(":").map(Number);
      const [eh, em] = inst.endTime.split(":").map(Number);
      schedulePeriods[`${inst.seriesId}-${dateToUtcStr(inst.instanceDate)}`] = Math.max(1, Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 45));
    }
    const instanceByDate = new Map<string, (typeof instances)[number]>();
    for (const inst of instances) instanceByDate.set(dateToUtcStr(inst.instanceDate), inst);

    const attendanceRecords = await db.attendance.findMany({
      where: { studentId: student.id, date: { gte: startDate, lte: endDate } },
    });
    const markedSchedules = new Set<string>();
    for (const att of attendanceRecords) {
      if (att.status !== "EXCUSED") {
        const inst = instanceByDate.get(toLocalDateStr(att.date));
        if (inst) markedSchedules.add(`${inst.seriesId}-${dateToUtcStr(inst.instanceDate)}`);
      }
    }
    let studentPeriods = 0;
    for (const key of markedSchedules) studentPeriods += schedulePeriods[key] ?? 1;

    // Cleanup
    await db.attendance.deleteMany({ where: { studentId: student.id } });
    await db.scheduleSeries.deleteMany({ where: { classId: cls.id } });
    await db.studentProfile.delete({ where: { id: student.id } });
    await db.class.delete({ where: { id: cls.id } });
    await db.user.delete({ where: { id: user.id } });

    // Kỳ vọng: 3 buổi (PRESENT/ABSENT/LATE) tính tiền; EXCUSED + chưa điểm danh không.
    // Mỗi buổi 07:30-09:00 = 90 phút = 2 tiết.
    expect(markedSchedules.size).toBe(3);
    expect(studentPeriods).toBe(3 * 2);
  });

  it("student21 (12A1) có buổi EXCUSED — attendance nghỉ có phép", async () => {
    const id = await sid("student21@eduweb.vn");
    expect(id).not.toBeNull();

    const records = await db.attendance.findMany({ where: { studentId: id } });
    const statuses = records.map((r) => r.status);
    expect(statuses).toContain("EXCUSED");
  });
});
