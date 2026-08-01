/**
 * Hàm thuần cho logic học phí — không chạm DB, không dùng server-only API.
 * Tách riêng khỏi src/actions/tuition.ts vì file "use server" chỉ được export async functions.
 */

/**
 * Tính toán khi ghi nhận một khoản nộp: phần vượt học phí chuyển thành surplus (credit).
 * Bất biến: paid ≤ amount.
 */
export function computePayment(
  paid: number,
  amount: number,
  paidIn: number,
): { effectivePaid: number; surplus: number; status: string } {
  const rawPaid = paid + paidIn;
  const surplus = Math.max(0, rawPaid - amount);
  const effectivePaid = rawPaid - surplus;
  // amount = 0 & chưa nộp → PENDING (không có gì để đóng). Đã đóng thực (>0) mới tính PAID/PARTIAL.
  const status = effectivePaid > 0 ? (effectivePaid >= amount ? "PAID" : "PARTIAL") : "PENDING";
  return { effectivePaid, surplus, status };
}

/**
 * Áp dụng số dư trả trước vào một kỳ: trừ credit vào phần còn thiếu.
 */
export function applyCreditToPeriod(
  amount: number,
  prevPaid: number,
  credit: number,
): { newPaid: number; creditUsed: number; creditRemaining: number; status: string } {
  const due = Math.max(0, amount - prevPaid);
  const creditUsed = Math.min(credit, due);
  const newPaid = prevPaid + creditUsed;
  const creditRemaining = credit - creditUsed;
  // Chưa đóng thực (>0) → PENDING (vd amount = 0 & không có credit).
  const status = newPaid > 0 ? (newPaid >= amount ? "PAID" : "PARTIAL") : "PENDING";
  return { newPaid, creditUsed, creditRemaining, status };
}
