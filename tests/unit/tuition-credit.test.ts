import { describe, it, expect } from "vitest";
import { computePayment, applyCreditToPeriod } from "@/lib/tuition-utils";

describe("computePayment - Ghi nhận khoản nộp", () => {
  it("nộp dư: paid vượt amount → effectivePaid chặn tại amount, phần dư thành surplus", () => {
    const r = computePayment(0, 432000, 500000);
    expect(r.effectivePaid).toBe(432000);
    expect(r.surplus).toBe(68000);
    expect(r.status).toBe("PAID");
  });

  it("nộp đủ: paid = amount, không surplus", () => {
    const r = computePayment(0, 432000, 432000);
    expect(r.effectivePaid).toBe(432000);
    expect(r.surplus).toBe(0);
    expect(r.status).toBe("PAID");
  });

  it("nộp thiếu: paid < amount, status PARTIAL", () => {
    const r = computePayment(0, 432000, 200000);
    expect(r.effectivePaid).toBe(200000);
    expect(r.surplus).toBe(0);
    expect(r.status).toBe("PARTIAL");
  });

  it("nộp sau khi đã đóng đủ: toàn bộ thành surplus", () => {
    const r = computePayment(432000, 432000, 100000);
    expect(r.effectivePaid).toBe(432000);
    expect(r.surplus).toBe(100000);
    expect(r.status).toBe("PAID");
  });

  it("paid = 0 & amount = 0: không surplus, status PENDING", () => {
    const r = computePayment(0, 0, 0);
    expect(r.effectivePaid).toBe(0);
    expect(r.surplus).toBe(0);
    expect(r.status).toBe("PENDING");
  });
});

describe("applyCreditToPeriod - Tự trừ credit vào kỳ", () => {
  it("credit hết: dùng toàn bộ credit để trả", () => {
    const r = applyCreditToPeriod(200000, 0, 68000);
    expect(r.newPaid).toBe(68000);
    expect(r.creditUsed).toBe(68000);
    expect(r.creditRemaining).toBe(0);
    expect(r.status).toBe("PARTIAL");
  });

  it("credit một phần: chỉ dùng đủ phần còn thiếu", () => {
    const r = applyCreditToPeriod(200000, 0, 68000);
    expect(r.creditUsed).toBe(68000);
    expect(r.creditRemaining).toBe(0);
  });

  it("credit thừa: trả đủ kỳ, credit còn dư", () => {
    const r = applyCreditToPeriod(50000, 0, 68000);
    expect(r.newPaid).toBe(50000);
    expect(r.creditUsed).toBe(50000);
    expect(r.creditRemaining).toBe(18000);
    expect(r.status).toBe("PAID");
  });

  it("kỳ đã nợ trước (prevPaid > 0): chỉ trừ phần còn thiếu", () => {
    const r = applyCreditToPeriod(432000, 200000, 68000);
    expect(r.newPaid).toBe(268000);
    expect(r.creditUsed).toBe(68000);
    expect(r.creditRemaining).toBe(0);
    expect(r.status).toBe("PARTIAL");
  });

  it("amount = 0 & không credit: newPaid = 0, status PENDING (không có gì để đóng)", () => {
    const r = applyCreditToPeriod(0, 0, 0);
    expect(r.newPaid).toBe(0);
    expect(r.creditUsed).toBe(0);
    expect(r.creditRemaining).toBe(0);
    expect(r.status).toBe("PENDING");
  });

  it("amount = 0 nhưng có credit: không tiêu credit (không có nợ), credit giữ nguyên", () => {
    const r = applyCreditToPeriod(0, 0, 68000);
    expect(r.newPaid).toBe(0);
    expect(r.creditUsed).toBe(0);
    expect(r.creditRemaining).toBe(68000);
    expect(r.status).toBe("PENDING");
  });

  it("amount giảm dưới paid (recalc): surplus trả về credit qua computePayment", () => {
    // Giả lập: trước kia amount=500k đã đóng 500k, giờ recalc amount=432k
    const comp = computePayment(500000, 432000, 0);
    expect(comp.effectivePaid).toBe(432000);
    expect(comp.surplus).toBe(68000);
    // Với prevPaid đã re-cap = 432k, credit 68k dùng cho kỳ sau
    const r = applyCreditToPeriod(200000, 432000, 68000);
    expect(r.newPaid).toBe(432000);
    expect(r.creditUsed).toBe(0); // kỳ đã đóng đủ → không tiêu credit
    expect(r.creditRemaining).toBe(68000);
  });
});
