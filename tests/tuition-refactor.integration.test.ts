import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Chỉ tắt mock @/lib/db để action dùng DB thật; giữ mock @/lib/auth để set session ADMIN.
vi.unmock("@/lib/db");

import { db } from "./helpers";
import { pool as actionPool } from "@/lib/db"; // pg.Pool mà action dùng (qua adapter) — để đếm SQL round-trip
import { getSession } from "@/lib/auth";
import { calculateTuition, getFeeSettings, recordPayment } from "@/actions/tuition";
import { expandSeriesToInstances, dateToUtcStr, jsDayToDow, toLocalDateStr } from "@/lib/schedule-expand";

const adminSession = { userId: "test-admin", email: "admin@test.local", role: "ADMIN" as const, name: "Test Admin" };
vi.mocked(getSession).mockResolvedValue(adminSession);

// ── Đếm SQL round-trip thật: wrap pool.query của instance action dùng ──
// (Prisma 7 + @prisma/adapter-pg không emit $on("query"), nên wrap pool trực tiếp)
let queryCount = 0;
const poolQueryOrig = (actionPool as unknown as { query: (...a: unknown[]) => Promise<unknown> }).query.bind(actionPool);
(actionPool as unknown as { query: (...a: unknown[]) => Promise<unknown> }).query = ((...args: unknown[]) => {
  queryCount++;
  return poolQueryOrig(...args);
}) as never;

const day = (m: number, d: number) => new Date(2026, m - 1, d, 7, 30, 0, 0);
const day2025 = (m: number, d: number) => new Date(2025, m - 1, d, 7, 30, 0, 0);
// UTC-midnight của ngày — dùng làm startDate/endDate cho series one-off (giống prisma/seed.ts).
const utcDay = (m: number, d: number) => new Date(Date.UTC(2026, m - 1, d));
const utcDay2025 = (m: number, d: number) => new Date(Date.UTC(2025, m - 1, d));
// Series one-off: startDate = endDate = ngày; dayOfWeek khớp đúng ngày (expand chỉ sinh instance khi khớp dayOfWeek).
const oneOff = (data: { classId: string; subjectId: string; teacherId: string; startTime: string; endTime: string; room?: string }, date: Date) => ({
  ...data,
  dayOfWeek: jsDayToDow(date.getUTCDay()),
  startDate: date,
  endDate: date,
});

async function clearClass(classId: string) {
  await db.attendance.deleteMany({ where: { student: { classes: { some: { id: classId } } } } });
  await db.tuition.deleteMany({ where: { classId } });
  await db.studentCredit.deleteMany({ where: { classId } });
  await db.scheduleSeries.deleteMany({ where: { classId } });
  const cls = await db.class.findUnique({ where: { id: classId }, include: { students: true } });
  if (cls) {
    for (const s of cls.students) {
      await db.studentProfile.deleteMany({ where: { id: s.id } }).catch(() => {});
      await db.user.deleteMany({ where: { id: s.userId } }).catch(() => {});
    }
  }
  await db.class.deleteMany({ where: { id: classId } }).catch(() => {});
}

describe("Refactor parity — kết quả giống hệt trước refactor (cùng số tiết mọi buổi)", () => {
  let classId = "";
  let subjectId = "";
  let teacherId = "";
  let studentId1 = "";
  let studentId2 = "";

  beforeAll(async () => {
    teacherId = (await db.teacherProfile.findFirstOrThrow()).id;
    subjectId = (await db.subject.findFirstOrThrow()).id;
    const cls = await db.class.create({ data: { name: `REF-PARITY-${Date.now()}`, gradeLevel: 10 } });
    classId = cls.id;
    for (const nm of ["Parity One", "Parity Two"]) {
      const u = await db.user.create({ data: { email: `parity-${Date.now()}-${nm.replace(/\s/g, "")}@test.local`, name: nm, passwordHash: "x", role: "STUDENT" } });
      const s = await db.studentProfile.create({ data: { userId: u.id, classes: { connect: { id: classId } } } });
      if (!studentId1) studentId1 = s.id;
      else studentId2 = s.id;
    }
    // Tháng 6: 2 buổi 07:30-09:00 (2 tiết); Tháng 7: 1 buổi 07:30-09:00 (2 tiết) — tất cả đã qua
    await db.scheduleSeries.createMany({
      data: [
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "09:00", room: "T" }, utcDay(6, 5)),
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "09:00", room: "T" }, utcDay(6, 6)),
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "09:00", room: "T" }, utcDay(7, 6)),
      ],
    });
    await db.attendance.createMany({
      data: [studentId1, studentId2].flatMap((sid) => [
        { studentId: sid, date: day(6, 5), status: "PRESENT" },
        { studentId: sid, date: day(6, 6), status: "PRESENT" },
        { studentId: sid, date: day(7, 6), status: "PRESENT" },
      ]),
    });
  });

  afterAll(async () => {
    await clearClass(classId);
  });

  it("tính 2 tháng 6-7: amount khớp công thức (2 tiết/buổi), mọi buổi đều tính", async () => {
    const { pricePerPeriod: price } = await getFeeSettings();
    const res = await calculateTuition(classId, 6, 7, 2026);
    expect(res.success).toBe(true);

    const rows = await db.tuition.findMany({ where: { classId } });
    expect(rows).toHaveLength(4); // 2 HS × 2 tháng

    const june = rows.filter((r) => r.month === 6);
    const july = rows.filter((r) => r.month === 7);
    for (const r of june) {
      expect(r.periods).toBe(2 * 2); // 2 buổi × 2 tiết
      expect(r.amount).toBe(4 * price);
      expect(r.paid).toBe(0);
      expect(r.status).toBe("PENDING");
    }
    for (const r of july) {
      expect(r.periods).toBe(2); // 1 buổi × 2 tiết
      expect(r.amount).toBe(2 * price);
    }
  });

  it("tính lại lần 2: không đổi paid/status, không tạo row thừa (update có chọn lọc)", async () => {
    const before = await db.tuition.findMany({ where: { classId } });
    await calculateTuition(classId, 6, 7, 2026);
    const after = await db.tuition.findMany({ where: { classId } });
    expect(after).toHaveLength(before.length);
    for (const r of before) {
      const now = after.find((x) => x.id === r.id)!;
      expect(now.paid).toBe(r.paid);
      expect(now.status).toBe(r.status);
      expect(now.amount).toBe(r.amount);
    }
  });
});

describe("Fix C — buổi học có số tiết khác nhau trong cùng kỳ", () => {
  let classId = "";
  let subjectId = "";
  let teacherId = "";
  let studentId = "";

  beforeAll(async () => {
    teacherId = (await db.teacherProfile.findFirstOrThrow()).id;
    subjectId = (await db.subject.findFirstOrThrow()).id;
    const cls = await db.class.create({ data: { name: `REF-MIXED-${Date.now()}`, gradeLevel: 10 } });
    classId = cls.id;
    const u = await db.user.create({ data: { email: `mixed-${Date.now()}@test.local`, name: "Mixed", passwordHash: "x", role: "STUDENT" } });
    const s = await db.studentProfile.create({ data: { userId: u.id, classes: { connect: { id: classId } } } });
    studentId = s.id;

    // Cùng tháng: buổi A 2 tiết (07:30-09:00), buổi B 3 tiết (07:30-10:00)
    await db.scheduleSeries.createMany({
      data: [
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "09:00", room: "T" }, utcDay(6, 5)),
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "10:00", room: "T" }, utcDay(6, 6)),
      ],
    });
    await db.attendance.createMany({
      data: [
        { studentId, date: day(6, 5), status: "PRESENT" },
        { studentId, date: day(6, 6), status: "PRESENT" },
      ],
    });
  });

  afterAll(async () => {
    await clearClass(classId);
  });

  it("tổng tiết = 2 + 3 = 5 (trước đây sẽ là 2×2=4 — sai khi buổi dài ngắn khác nhau)", async () => {
    const { pricePerPeriod: price } = await getFeeSettings();
    const res = await calculateTuition(classId, 6, 6, 2026);
    expect(res.success).toBe(true);

    const row = await db.tuition.findFirstOrThrow({ where: { classId, month: 6, year: 2026 } });
    expect(row.periods).toBe(2 + 3); // tổng tiết từng buổi
    expect(row.amount).toBe(5 * price);

    const data = res.data?.find((d) => d.studentId === studentId);
    expect(data?.periods).toBe(5);
    expect(data?.markedCount).toBe(2);
  });
});

describe("Credit + update có chọn lọc — nộp dư, credit tự trừ kỳ sau, recalc trả surplus về credit", () => {
  let classId = "";
  let subjectId = "";
  let teacherId = "";
  let studentId = "";

  beforeAll(async () => {
    teacherId = (await db.teacherProfile.findFirstOrThrow()).id;
    subjectId = (await db.subject.findFirstOrThrow()).id;
    const cls = await db.class.create({ data: { name: `REF-CREDIT-${Date.now()}`, gradeLevel: 10 } });
    classId = cls.id;
    const u = await db.user.create({ data: { email: `credit-${Date.now()}@test.local`, name: "Credit", passwordHash: "x", role: "STUDENT" } });
    const s = await db.studentProfile.create({ data: { userId: u.id, classes: { connect: { id: classId } } } });
    studentId = s.id;
    // Tháng 6: 1 buổi 07:30-09:00 (2 tiết); Tháng 7: 1 buổi 07:30-09:00 (2 tiết) — đều đã qua
    await db.scheduleSeries.createMany({
      data: [
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "09:00", room: "T" }, utcDay(6, 5)),
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "09:00", room: "T" }, utcDay(7, 6)),
      ],
    });
    await db.attendance.createMany({
      data: [
        { studentId, date: day(6, 5), status: "PRESENT" },
        { studentId, date: day(7, 6), status: "PRESENT" },
      ],
    });
  });

  afterAll(async () => {
    await clearClass(classId);
  });

  it("nộp dư ở tháng 6 → surplus thành credit; tháng 7 credit tự trừ", async () => {
    const { pricePerPeriod: price } = await getFeeSettings();
    const amount6 = 2 * price; // 2 tiết
    const amount7 = 2 * price;

    // Tính tháng 6
    await calculateTuition(classId, 6, 6, 2026);
    const t6 = await db.tuition.findFirstOrThrow({ where: { classId, month: 6, year: 2026 } });
    expect(t6.amount).toBe(amount6);
    expect(t6.paid).toBe(0);

    // Nộp dư 100000 > amount6 → surplus = 100000 - amount6
    const surplusExpected = 100000 - amount6;
    const pay = await recordPayment(t6.id, 100000, "CASH", "Trả trước");
    expect(pay.success).toBe(true);
    expect(pay.surplus).toBe(surplusExpected);

    const creditAfterPay = await db.studentCredit.findUnique({ where: { studentId_classId: { studentId, classId } } });
    expect(creditAfterPay!.credit).toBe(surplusExpected);

    // Tính lại tháng 6 — không đổi gì (paid đã chặn tại amount, credit giữ nguyên)
    await calculateTuition(classId, 6, 6, 2026);
    const t6b = await db.tuition.findUniqueOrThrow({ where: { id: t6.id } });
    expect(t6b.paid).toBe(amount6);
    expect(t6b.status).toBe("PAID");

    // Tính tháng 7 → credit tự trừ vào khoản thiếu
    await calculateTuition(classId, 7, 7, 2026);
    const t7 = await db.tuition.findFirstOrThrow({ where: { classId, month: 7, year: 2026 } });
    expect(t7.amount).toBe(amount7);
    expect(t7.paid).toBe(Math.min(amount7, surplusExpected));
    expect(t7.status).toBe(surplusExpected >= amount7 ? "PAID" : "PARTIAL");

    const creditAfter7 = await db.studentCredit.findUnique({ where: { studentId_classId: { studentId, classId } } });
    expect(creditAfter7!.credit).toBe(Math.max(0, surplusExpected - amount7));
  });

  it("recalc giảm amount dưới paid → trả surplus về credit (nhánh update-so-sánh)", async () => {
    const { pricePerPeriod: price } = await getFeeSettings();
    const before = await db.studentCredit.findUniqueOrThrow({ where: { studentId_classId: { studentId, classId } } });
    const creditBefore = before.credit;

    // Giả lập recalc: xoá 1 buổi điểm danh tháng 7 → amount7 giảm từ 2 tiết còn 0 tiết,
    // nhưng paid đã đóng đủ amount7 cũ → phần chênh phải trả về credit.
    await db.attendance.deleteMany({ where: { studentId, date: day(7, 6) } });
    const t7 = await db.tuition.findFirstOrThrow({ where: { classId, month: 7, year: 2026 } });
    const paid7 = t7.paid; // đã đóng >= amount7 (sau test trên)

    await calculateTuition(classId, 7, 7, 2026);
    const t7b = await db.tuition.findUniqueOrThrow({ where: { id: t7.id } });
    expect(t7b.periods).toBe(0);
    expect(t7b.amount).toBe(0);
    expect(t7b.paid).toBe(0);
    expect(t7b.status).toBe("PENDING");

    // Phần đã đóng vượt amount (giờ = 0) → dồn về credit
    const after = await db.studentCredit.findUniqueOrThrow({ where: { studentId_classId: { studentId, classId } } });
    expect(after.credit).toBe(creditBefore + paid7);
  });
});

describe("Query count — 30 HS × 12 tháng phải giảm mạnh (dưới ~10 query)", () => {
  let classId = "";
  let subjectId = "";
  let teacherId = "";
  const studentIds: string[] = [];

  beforeAll(async () => {
    teacherId = (await db.teacherProfile.findFirstOrThrow()).id;
    subjectId = (await db.subject.findFirstOrThrow()).id;
    const cls = await db.class.create({ data: { name: `REF-30-${Date.now()}`, gradeLevel: 10 } });
    classId = cls.id;

    const stamp = Date.now();
    const pairs = await Promise.all(
      Array.from({ length: 30 }, async (_, i) => {
        const u = await db.user.create({ data: { email: `q30-${stamp}-${i}@test.local`, name: `S${i}`, passwordHash: "x", role: "STUDENT" } });
        const p = await db.studentProfile.create({ data: { userId: u.id, classes: { connect: { id: classId } } } });
        return p.id;
      }),
    );
    studentIds.push(...pairs);
    console.log(`[seed] connected students = ${studentIds.length}`);

    // 12 tháng năm 2025 (đều đã qua) — mỗi tháng 1 buổi 07:30-09:00 (2 tiết)
    await db.scheduleSeries.createMany({
      data: Array.from({ length: 12 }, (_, i) =>
        oneOff({ classId, subjectId, teacherId, startTime: "07:30", endTime: "09:00", room: "Q" }, utcDay2025(i + 1, 5))
      ),
    });
    // Attendance theo local-midnight từ instance date (khớp cách markAttendance lưu).
    const series = await db.scheduleSeries.findMany({ where: { classId }, include: { exceptions: true } });
    const instances = series.flatMap((s) =>
      expandSeriesToInstances(s, s.exceptions, new Date(Date.UTC(2025, 0, 1)), new Date(Date.UTC(2025, 11, 31)))
    );
    const attendanceData = studentIds.flatMap((sid) =>
      instances.map((inst) => {
        const ds = dateToUtcStr(inst.instanceDate).split("-").map(Number);
        return { studentId: sid, date: new Date(ds[0], ds[1] - 1, ds[2], 7, 30, 0, 0), status: "PRESENT" as const };
      }),
    );
    await db.attendance.createMany({ data: attendanceData });
  });

  afterAll(async () => {
    await clearClass(classId);
  });

  it("tính 12 tháng × 30 HS chỉ tốn < 12 query (trước đây ~775)", async () => {
    queryCount = 0; // Reset bộ đếm ngay trước khi đo — loại bỏ query seed
    const res = await calculateTuition(classId, 1, 12, 2025);
    expect(res.success).toBe(true);

    const { pricePerPeriod: price } = await getFeeSettings();
    const rows = await db.tuition.findMany({ where: { classId } });
    expect(rows).toHaveLength(30 * 12);
    for (const r of rows) {
      expect(r.periods).toBe(2);
      expect(r.amount).toBe(2 * price);
    }

    const measured = queryCount; // count của riêng calculateTuition
    console.log(`[query-count] 30 HS × 12 tháng → ${measured} query`);
    expect(measured).toBeLessThan(12);
  });
});
