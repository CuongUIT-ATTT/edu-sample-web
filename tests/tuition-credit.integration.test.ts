import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Chỉ tắt mock @/lib/db để action dùng DB thật; giữ mock @/lib/auth để set session ADMIN.
vi.unmock("@/lib/db");

import { db } from "./helpers";
import { getSession } from "@/lib/auth";
import { recordPayment, calculateTuition, getFeeSettings } from "@/actions/tuition";
import { jsDayToDow } from "@/lib/schedule-expand";

const adminSession = { userId: "test-admin", email: "admin@test.local", role: "ADMIN" as const, name: "Test Admin", isRoot: false };
vi.mocked(getSession).mockResolvedValue(adminSession);

let userId = "";
let studentId = "";
let classId = "";
let subjectId = "";
let teacherId = "";

async function cleanup() {
  if (classId) {
    await db.tuition.deleteMany({ where: { classId } });
    await db.studentCredit.deleteMany({ where: { classId } });
    await db.scheduleSeries.deleteMany({ where: { classId } });
  }
  if (studentId) await db.studentProfile.deleteMany({ where: { id: studentId } }).catch(() => {});
  if (classId) await db.class.deleteMany({ where: { id: classId } }).catch(() => {});
  if (userId) await db.user.deleteMany({ where: { id: userId } }).catch(() => {});
}

describe("Tuition credit - recordPayment nộp dư", () => {
  beforeAll(async () => {
    const teacher = await db.teacherProfile.findFirstOrThrow();
    teacherId = teacher.id;
    const subject = await db.subject.findFirstOrThrow();
    subjectId = subject.id;
    const user = await db.user.create({ data: { email: `credit-test-${Date.now()}@test.local`, name: "Credit Test", passwordHash: "x", role: "STUDENT" } });
    userId = user.id;
    const student = await db.studentProfile.create({ data: { userId: user.id } });
    studentId = student.id;
    const cls = await db.class.create({ data: { name: `TEST-CREDIT-${Date.now()}`, gradeLevel: 10 } });
    classId = cls.id;
    await db.studentProfile.update({ where: { id: student.id }, data: { classes: { connect: { id: cls.id } } } });

    // 3 series one-off: tháng 6 (2 buổi), tháng 7 (1 buổi) — đều đã qua (hôm nay 01/08) nên không bị cap
    const utcDay = (m: number, d: number) => new Date(Date.UTC(2026, m - 1, d));
    const oneOff = (d: Date) => ({ classId, subjectId, teacherId, dayOfWeek: jsDayToDow(d.getUTCDay()), startTime: "07:30", endTime: "09:00", room: "TEST", startDate: d, endDate: d });
    await db.scheduleSeries.create({ data: oneOff(utcDay(6, 5)) });
    await db.scheduleSeries.create({ data: oneOff(utcDay(6, 6)) });
    await db.scheduleSeries.create({ data: oneOff(utcDay(7, 6)) });
    // Attendance tháng 6: 2 buổi đều điểm danh PRESENT → amount = 2 × 2 tiết × 18000 = 72000
    await db.attendance.create({ data: { studentId, date: new Date(2026, 5, 5, 7, 30), status: "PRESENT" } });
    await db.attendance.create({ data: { studentId, date: new Date(2026, 5, 6, 7, 30), status: "PRESENT" } });
    // Attendance tháng 7: 1 buổi điểm danh PRESENT → amount = 1 × 2 tiết × 18000 = 36000
    await db.attendance.create({ data: { studentId, date: new Date(2026, 6, 6, 7, 30), status: "PRESENT" } });
  });

  afterAll(async () => {
    await cleanup();
  });

  it("nộp dư → paid chặn tại amount, phần dư thành studentCredit theo cặp (student, class)", async () => {
    const { pricePerPeriod: price } = await getFeeSettings();
    const amount6 = 2 * 2 * price; // 2 buổi × 2 tiết

    // Tính học phí tháng 6
    const calc = await calculateTuition(classId, 6, 6, 2026);
    expect(calc.success).toBe(true);

    const tuition6 = await db.tuition.findFirst({ where: { classId, month: 6, year: 2026 } });
    expect(tuition6!.amount).toBe(amount6);
    expect(tuition6!.paid).toBe(0);

    // Nộp 100000 > amount → dư = 100000 - amount6
    const surplusExpected = 100000 - amount6;
    const res = await recordPayment(tuition6!.id, 100000, "CASH", "Trả trước");
    expect(res.success).toBe(true);
    expect(res.surplus).toBe(surplusExpected);

    const t6after = await db.tuition.findUnique({ where: { id: tuition6!.id } });
    expect(t6after!.paid).toBe(amount6); // chặn tại amount
    expect(t6after!.status).toBe("PAID");

    const credit = await db.studentCredit.findUnique({ where: { studentId_classId: { studentId, classId } } });
    expect(credit!.credit).toBe(surplusExpected);
  });

  it("tính học phí tháng sau → credit tự trừ, paid không reset, lịch sử payment giữ nguyên", async () => {
    const { pricePerPeriod: price } = await getFeeSettings();
    const amount6 = 2 * 2 * price;
    const surplusExpected = 100000 - amount6;
    const amount7 = 1 * 2 * price; // tháng 7: 1 buổi = 2 tiết

    // Tính học phí tháng 7 — credit tự trừ vào phần còn thiếu
    const calc = await calculateTuition(classId, 7, 7, 2026);
    expect(calc.success).toBe(true);

    const tuition7 = await db.tuition.findFirst({ where: { classId, month: 7, year: 2026 } });
    expect(tuition7!.amount).toBe(amount7);
    expect(tuition7!.paid).toBe(Math.min(amount7, surplusExpected)); // credit tự trừ
    expect(tuition7!.status).toBe(surplusExpected >= amount7 ? "PAID" : "PARTIAL");

    const credit = await db.studentCredit.findUnique({ where: { studentId_classId: { studentId, classId } } });
    expect(credit!.credit).toBe(Math.max(0, surplusExpected - amount7)); // credit còn lại

    // Tính lại tháng 6 → paid KHÔNG bị reset (fix lỗi mất dữ liệu), payment giữ nguyên
    await calculateTuition(classId, 6, 6, 2026);
    const t6 = await db.tuition.findFirst({ where: { classId, month: 6, year: 2026 }, include: { payments: true } });
    expect(t6!.paid).toBe(amount6);
    expect(t6!.payments.length).toBe(1); // khoản 100k vẫn còn
  });

  it("TEACHER không phụ trách lớp → recordPayment bị từ chối", async () => {
    // Lấy tuition tháng 7 (đã được credit trừ ở test trước) làm mốc paid hiện tại
    const tuition7 = await db.tuition.findFirst({ where: { classId, month: 7, year: 2026 } });
    const paidBefore = tuition7!.paid;
    const paymentsBefore = await db.tuitionPayment.count({ where: { tuitionId: tuition7!.id } });

    // Tạo 1 teacher mới KHÔNG phụ trách lớp TEST-CREDIT này
    const tUser = await db.user.create({
      data: { email: `t-other-${Date.now()}@test.local`, name: "Teacher Khac", passwordHash: "x", role: "TEACHER" },
    });
    await db.teacherProfile.create({ data: { userId: tUser.id } });
    vi.mocked(getSession).mockResolvedValue({
      userId: tUser.id,
      email: tUser.email,
      role: "TEACHER" as const,
      name: tUser.name,
      isRoot: false,
    });

    const res = await recordPayment(tuition7!.id, 50000, "CASH", "Test teacher");
    expect(res.success).toBe(false);
    expect(res.error).toContain("không phụ trách");

    // Không tạo payment, paid không đổi
    const after = await db.tuition.findUnique({ where: { id: tuition7!.id } });
    expect(after!.paid).toBe(paidBefore);
    const paymentsAfter = await db.tuitionPayment.count({ where: { tuitionId: tuition7!.id } });
    expect(paymentsAfter).toBe(paymentsBefore);

    // Cleanup teacher vừa tạo
    await db.teacherProfile.deleteMany({ where: { userId: tUser.id } }).catch(() => {});
    await db.user.deleteMany({ where: { id: tUser.id } }).catch(() => {});
  });
});
