/**
 * Hàm thuần cho thanh toán PayOS — không chạm DB, không dùng server-only API.
 * Tách riêng khỏi src/actions/payment.ts vì file "use server" chỉ được export async functions.
 * (Mirror pattern của src/lib/tuition-utils.ts)
 */

/** Sinh mã đơn hàng dương 9 chữ số (int32-safe, < 2.147.483.647). */
export function generateOrderCode(): number {
  return 100_000_000 + Math.floor(Math.random() * 900_000_000);
}

/**
 * Vệ sinh chuỗi mô tả đơn hàng theo ràng buộc PayOS:
 * - Tối đa 25 ký tự
 * - Không dấu (chỉ ASCII)
 */
export function sanitizeDescription(input: string): string {
  return (
    input
      // Tách tổ hợp dấu (NFD) rồi loại các ký tự combining
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      // Chỉ giữ chữ cái, số, dấu gạch ngang, gạch dưới, chấm, gạch chéo, khoảng trắng
      .replace(/[^A-Za-z0-9\-_.\/ ]/g, "")
      // Gộp nhiều khoảng trắng liên tiếp
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 25)
  );
}

/** Dựng mô tả thanh toán học phí, ví dụ: "HP 6/2026 10A1" (không dấu, ≤ 25 ký tự). */
export function buildPaymentDescription(month: number, year: number, className: string): string {
  return sanitizeDescription(`HP ${month}/${year} ${className}`);
}

/**
 * Số tiền còn phải đóng (VND, số nguyên).
 * Trả về ≥ 1; gọi viên phải tự kiểm tra "đã đóng đủ" trước khi dùng kết quả ≤ 0.
 */
export function dueAmount(amount: number, paid: number): number {
  return Math.max(1, Math.round(amount - paid));
}
