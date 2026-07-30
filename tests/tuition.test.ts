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

describe("Tuition - Chỉ EXCUSED mới trừ tiết", () => {
  it("tui-004: sp-004 ABSENT 3 buổi nhưng periods vẫn 24 (ABSENT không trừ)", async () => {
    const t = await db.tuition.findUnique({ where: { id: "tui-004" } });
    expect(t!.periods).toBe(24);

    const absentCount = await db.attendance.count({
      where: { studentId: t!.studentId, status: "ABSENT" },
    });
    expect(absentCount).toBeGreaterThanOrEqual(3);

    const excusedCount = await db.attendance.count({
      where: { studentId: t!.studentId, status: "EXCUSED" },
    });
    expect(excusedCount).toBe(0); // không có EXCUSED → không bị trừ
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
