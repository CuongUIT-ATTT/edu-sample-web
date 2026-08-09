import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Chỉ tắt mock @/lib/db để dùng DB thật; giữ mock @/lib/auth (không dùng session ở đây,
// nhưng mặc định để tránh lỗi khi import các action liên quan).
vi.unmock("@/lib/db");

import { db } from "./helpers";
import { applyPayosSuccess, type PayosWebhookPayload } from "@/lib/payos-reconcile";

let userId = "";
let studentId = "";
let classId = "";
let tuitionId = "";

function payload(orderCode: number, amount: number, reference?: string): PayosWebhookPayload {
  return {
    code: "00",
    desc: "success",
    success: true,
    data: {
      orderCode,
      amount,
      description: "HP test",
      reference,
      paymentLinkId: "pl-test",
    },
    signature: "sig-test",
  };
}

async function cleanup() {
  await db.paymentLink.deleteMany({ where: { studentId } }).catch(() => {});
  await db.tuitionPayment.deleteMany({ where: { studentId } }).catch(() => {});
  await db.tuition.deleteMany({ where: { studentId } }).catch(() => {});
  await db.studentCredit.deleteMany({ where: { studentId } }).catch(() => {});
  await db.studentProfile.deleteMany({ where: { id: studentId } }).catch(() => {});
  await db.class.deleteMany({ where: { id: classId } }).catch(() => {});
  await db.user.deleteMany({ where: { id: userId } }).catch(() => {});
}

describe("applyPayosSuccess - Webhook PayOS reconcile", () => {
  beforeAll(async () => {
    const user = await db.user.create({
      data: { email: `payos-${Date.now()}@test.local`, name: "PayOS Test", passwordHash: "x", role: "STUDENT" },
    });
    userId = user.id;
    const student = await db.studentProfile.create({ data: { userId: user.id } });
    studentId = student.id;
    const cls = await db.class.create({ data: { name: `TEST-PAYOS-${Date.now()}`, gradeLevel: 10 } });
    classId = cls.id;
    const tuition = await db.tuition.create({
      data: {
        studentId,
        classId,
        month: 6,
        year: 2026,
        periods: 4,
        amount: 72_000,
        paid: 0,
        status: "PENDING",
      },
    });
    tuitionId = tuition.id;
  });

  afterAll(async () => {
    await cleanup();
  });

  it("orderCode không tồn tại → not_found (no-op)", async () => {
    const res = await applyPayosSuccess(payload(123_456_789, 72_000, "ref-unknown"));
    expect(res.status).toBe("not_found");
  });

  it("giao dịch thành công → link PAID + 1 TuitionPayment + tuition.paid/status + connect class", async () => {
    const orderCode = 987_654_321;
    await db.paymentLink.create({
      data: {
        orderCode,
        amount: 72_000,
        description: "HP test",
        status: "PENDING",
        checkoutUrl: "https://pay.example/checkout",
        studentId,
        classId,
        tuitionId,
        month: 6,
        year: 2026,
      },
    });

    const res = await applyPayosSuccess(payload(orderCode, 72_000, "ref-001"));
    expect(res.status).toBe("applied");
    if (res.status !== "applied") throw new Error("expected applied");
    expect(res.tuitionId).toBe(tuitionId);

    const link = await db.paymentLink.findUnique({ where: { orderCode } });
    expect(link!.status).toBe("PAID");
    expect(link!.paidAt).not.toBeNull();

    const payments = await db.tuitionPayment.findMany({ where: { studentId } });
    expect(payments.length).toBe(1);
    expect(payments[0].method).toBe("PAYOS");
    expect(payments[0].recordedBy).toBe("payos-webhook");
    expect(payments[0].payosReference).toBe("ref-001");
    expect(payments[0].amount).toBe(72_000);

    const tuition = await db.tuition.findUnique({ where: { id: tuitionId } });
    expect(tuition!.paid).toBe(72_000);
    expect(tuition!.status).toBe("PAID");

    // Student được gán vào class
    const student = await db.studentProfile.findUnique({
      where: { id: studentId },
      include: { classes: { where: { id: classId } } },
    });
    expect(student!.classes.length).toBe(1);
  });

  it("webhook trùng lặp → noop, không thêm payment lần 2", async () => {
    const paymentsBefore = await db.tuitionPayment.count({ where: { studentId } });
    const res = await applyPayosSuccess(payload(987_654_321, 72_000, "ref-002"));
    expect(res.status).toBe("noop");

    const paymentsAfter = await db.tuitionPayment.count({ where: { studentId } });
    expect(paymentsAfter).toBe(paymentsBefore);
  });

  it("nộp dư (amount > tuition.amount) → surplus vào studentCredit, paid chặn tại amount", async () => {
    // Tạo tuition mới còn PENDING để cô lập surplus (tuitionId cũ đã được nộp đủ ở test trước).
    const freshTuition = await db.tuition.create({
      data: {
        studentId,
        classId,
        month: 7,
        year: 2026,
        periods: 4,
        amount: 72_000,
        paid: 0,
        status: "PENDING",
      },
    });

    const orderCode = 555_111_222;
    await db.paymentLink.create({
      data: {
        orderCode,
        amount: 100_000,
        description: "HP test",
        status: "PENDING",
        checkoutUrl: "https://pay.example/checkout",
        studentId,
        classId,
        tuitionId: freshTuition.id,
        month: 7,
        year: 2026,
      },
    });

    const res = await applyPayosSuccess(payload(orderCode, 100_000, "ref-surplus"));
    expect(res.status).toBe("applied");

    const tuition = await db.tuition.findUnique({ where: { id: freshTuition.id } });
    // amount tuition = 72000, nộp 100000 → surplus 28000
    expect(tuition!.paid).toBe(72_000);
    expect(tuition!.status).toBe("PAID");

    const credit = await db.studentCredit.findUnique({
      where: { studentId_classId: { studentId, classId } },
    });
    expect(credit!.credit).toBe(28_000);

    // Dọn tuition vừa tạo (không để lẫn sang test sau)
    await db.tuitionPayment.deleteMany({ where: { tuitionId: freshTuition.id } });
    await db.tuition.delete({ where: { id: freshTuition.id } });
  });

  it("tuition bị xóa trước webhook → fallback tạo Tuition mới (paid = amount) + connect class", async () => {
    const orderCode = 444_555_666;
    const orphanStudentId = studentId;
    const orphanClassId = classId;

    // Tạo tuition rồi xóa (simulate tuition deleted before webhook arrives)
    const tmpTuition = await db.tuition.create({
      data: {
        studentId,
        classId,
        month: 8,
        year: 2026,
        periods: 0,
        amount: 50_000,
        paid: 0,
        status: "PENDING",
      },
    });
    await db.tuition.delete({ where: { id: tmpTuition.id } });

    await db.paymentLink.create({
      data: {
        orderCode,
        amount: 50_000,
        description: "HP test",
        status: "PENDING",
        checkoutUrl: "https://pay.example/checkout",
        studentId: orphanStudentId,
        classId: orphanClassId,
        tuitionId: null, // tuition đã bị xóa → link không còn trỏ tới
        month: 8,
        year: 2026,
      },
    });

    const res = await applyPayosSuccess(payload(orderCode, 50_000, "ref-fallback"));
    expect(res.status).toBe("applied");
    if (res.status !== "applied") throw new Error("expected applied");
    expect(res.tuitionId).toBeNull();

    const fallbackTuition = await db.tuition.findFirst({
      where: { studentId: orphanStudentId, classId: orphanClassId, month: 8, year: 2026 },
    });
    expect(fallbackTuition).not.toBeNull();
    expect(fallbackTuition!.paid).toBe(50_000);
    expect(fallbackTuition!.status).toBe("PAID");
    expect(fallbackTuition!.note).toContain("webhook");

    // Vẫn connect student vào class
    const student = await db.studentProfile.findUnique({
      where: { id: orphanStudentId },
      include: { classes: { where: { id: orphanClassId } } },
    });
    expect(student!.classes.length).toBe(1);
  });
});
