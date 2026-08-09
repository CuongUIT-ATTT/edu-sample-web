import { describe, it, expect } from "vitest";
import {
  generateOrderCode,
  sanitizeDescription,
  buildPaymentDescription,
  dueAmount,
} from "@/lib/payos-utils";

describe("generateOrderCode - Mã đơn hàng PayOS", () => {
  it("sinh mã dương 9 chữ số trong phạm vi [100000000, 999999999]", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateOrderCode();
      expect(code).toBeGreaterThanOrEqual(100_000_000);
      expect(code).toBeLessThanOrEqual(999_999_999);
      expect(Number.isInteger(code)).toBe(true);
    }
  });
});

describe("sanitizeDescription - Vệ sinh mô tả PayOS", () => {
  it("bỏ dấu tiếng Việt và chỉ giữ ASCII", () => {
    const result = sanitizeDescription("Lớp 10A1 – Học phí tháng 6");
    expect(result).not.toMatch(/[à-ỹ]/i);
    expect(result).toMatch(/^[A-Za-z0-9\-_. ]+$/);
  });

  it("cắt chuỗi về tối đa 25 ký tự", () => {
    const result = sanitizeDescription("Học phí tháng 6 lớp 10A1 trường Trung tâm bồi dưỡng kiến thức EDUTECH");
    expect(result.length).toBeLessThanOrEqual(25);
  });

  it("gộp khoảng trắng liên tiếp", () => {
    const result = sanitizeDescription("HP   6/2026   10A1");
    expect(result).toBe("HP 6/2026 10A1");
  });
});

describe("buildPaymentDescription - Mô tả thanh toán học phí", () => {
  it("tạo chuỗi 'HP <tháng>/<năm> <lớp>'", () => {
    const result = buildPaymentDescription(6, 2026, "10A1");
    expect(result).toBe("HP 6/2026 10A1");
  });

  it("kết quả không dấu và ≤ 25 ký tự", () => {
    const result = buildPaymentDescription(12, 2026, "12B3 Nâng cao");
    expect(result.length).toBeLessThanOrEqual(25);
    expect(result).not.toMatch(/[à-ỹ]/i);
  });
});

describe("dueAmount - Số tiền còn phải đóng", () => {
  it("tính đúng phần còn thiếu và làm tròn", () => {
    expect(dueAmount(432_000, 200_000)).toBe(232_000);
    expect(dueAmount(432_000.4, 0)).toBe(432_000); // Math.round(432000.4) = 432000
    expect(dueAmount(432_000.6, 0)).toBe(432_001); // Math.round(432000.6) = 432001
  });

  it("đã đóng đủ hoặc dư vẫn trả về tối thiểu 1 (không bao giờ ≤ 0)", () => {
    expect(dueAmount(432_000, 432_000)).toBe(1);
    expect(dueAmount(432_000, 500_000)).toBe(1);
  });
});
