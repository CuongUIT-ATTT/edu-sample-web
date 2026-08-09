import { db } from "@/lib/db";
import { computePayment } from "@/lib/tuition-utils";

/**
 * Reconcile dữ liệu webhook PayOS — CHỈ chạm DB, KHÔNG import @payos/node.
 * Tách khỏi route handler để testable trực tiếp (không cần key/mock SDK).
 * Mirror logic ghi nhận thanh toán của recordPayment() trong src/actions/tuition.ts.
 */

/** Dữ liệu webhook đã được verify (payload.success === true && payload.code === "00"). */
export interface PayosWebhookData {
  orderCode: number;
  amount: number;
  description?: string;
  accountNumber?: string;
  reference?: string;
  transactionDateTime?: string;
  currency?: string;
  paymentLinkId?: string;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
}

export interface PayosWebhookPayload {
  code: string;
  desc: string;
  success: boolean;
  data: PayosWebhookData;
  signature?: string;
}

export type ApplyResult =
  | { status: "noop" } // link đã PAID trước đó — không ghi đè, idempotent
  | { status: "applied"; tuitionId: string | null }
  | { status: "not_found" }; // orderCode không khớp — ping/unknown, không retry

/**
 * Xử lý giao dịch thành công từ webhook PayOS:
 * 1. Tìm link theo orderCode (không có → not_found, no-op).
 * 2. Idempotency: updateMany conditional (status chưa PAID) — 1 giao dịch thắng.
 * 3. Ghi TuitionPayment (method "PAYOS", recordedBy "payos-webhook").
 * 4. Cập nhật Tuition.paid/status + surplus → StudentCredit.
 * 5. Fallback: tuition bị xóa trước webhook → tạo Tuition tối thiểu.
 * 6. Connect student vào class (implicit M2M, idempotent).
 */
export async function applyPayosSuccess(payload: PayosWebhookPayload): Promise<ApplyResult> {
  const data = payload.data;
  const orderCode = Number(data.orderCode);

  const link = await db.paymentLink.findUnique({ where: { orderCode } });
  if (!link) return { status: "not_found" };

  const result = await db.$transaction(async (tx) => {
    // ── Idempotency guard: chỉ 1 webhook concurrent thắng ──
    const claimed = await tx.paymentLink.updateMany({
      where: { id: link.id, status: { not: "PAID" } },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (claimed.count === 0) return { status: "noop" } as const;

    const paidIn = data.amount > 0 ? data.amount : link.amount;

    // ── Normal path: tuition còn tồn tại ──
    const tuition = link.tuitionId
      ? await tx.tuition.findUnique({ where: { id: link.tuitionId } })
      : null;

    if (tuition) {
      const { effectivePaid, surplus, status } = computePayment(tuition.paid, tuition.amount, paidIn);
      await tx.tuitionPayment.create({
        data: {
          tuitionId: tuition.id,
          studentId: link.studentId,
          amount: paidIn,
          paidAt: new Date(),
          method: "PAYOS",
          note: `PayOS #${orderCode}${data.reference ? " ref " + data.reference : ""}`,
          recordedBy: "payos-webhook",
          payosReference: data.reference || null,
        },
      });
      await tx.tuition.update({
        where: { id: tuition.id },
        data: { paid: effectivePaid, status },
      });
      if (surplus > 0) {
        await tx.studentCredit.upsert({
          where: { studentId_classId: { studentId: link.studentId, classId: tuition.classId } },
          update: { credit: { increment: surplus } },
          create: { studentId: link.studentId, classId: tuition.classId, credit: surplus },
        });
      }
    } else {
      // ── Defensive: tuition bị xóa trước khi webhook đến ──
      // Tạo row tối thiểu với paid = amount (bất biến paid ≤ amount của computePayment).
      const clsId = link.classId;
      if (!clsId) throw new Error("PaymentLink thiếu classId");
      const created = await tx.tuition.create({
        data: {
          studentId: link.studentId,
          classId: clsId,
          month: link.month,
          year: link.year,
          periods: 0,
          amount: paidIn,
          paid: paidIn,
          status: "PAID",
          note: "Tạo tự động từ webhook PayOS",
        },
      });
      await tx.tuitionPayment.create({
        data: {
          tuitionId: created.id,
          studentId: link.studentId,
          amount: paidIn,
          paidAt: new Date(),
          method: "PAYOS",
          note: `PayOS #${orderCode}${data.reference ? " ref " + data.reference : ""}`,
          recordedBy: "payos-webhook",
          payosReference: data.reference || null,
        },
      });
    }

    // ── Gán học sinh vào lớp (connect M2M — idempotent) ──
    if (link.classId) {
      await tx.studentProfile.update({
        where: { id: link.studentId },
        data: { classes: { connect: { id: link.classId } } },
      });
    }

    return { status: "applied", tuitionId: link.tuitionId ?? null } as const;
  });

  return result;
}
