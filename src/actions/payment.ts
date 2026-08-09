"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { payos, isPayosConfigured } from "@/lib/payos";
import {
  generateOrderCode,
  buildPaymentDescription,
  dueAmount,
} from "@/lib/payos-utils";
import { applyPayosSuccess } from "@/lib/payos-reconcile";

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://www.edu-web.duckdns.org";
const PAYOS_EXPIRY_SECONDS = 30 * 60; // link thanh toán hết hạn sau 30 phút

type PaymentLinkStatus = "PENDING" | "PAID" | "CANCELLED";

/** Trả về tập id các con mà phụ huynh được phép thao tác. */
async function resolveParentStudentIds(userId: string): Promise<Set<string>> {
  const parent = await db.parentProfile.findUnique({
    where: { userId },
    include: { students: { select: { id: true } } },
  });
  return new Set((parent?.students ?? []).map((s) => s.id));
}

/**
 * Tạo link thanh toán PayOS cho 1 khoản học phí (STUDENT/PARENT).
 * Trả checkoutUrl để client redirect, hoặc { success: false, error }.
 */
export async function createPaymentLink(tuitionId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "PARENT")) {
      return { success: false, error: "Không có quyền thanh toán trực tuyến." };
    }

    const tuition = await db.tuition.findUnique({
      where: { id: tuitionId },
      include: { class: { select: { name: true } } },
    });
    if (!tuition) return { success: false, error: "Không tìm thấy khoản học phí." };

    // Ownership: STUDENT — tuition của mình; PARENT — tuition của con mình.
    let studentId: string;
    if (session.role === "STUDENT") {
      const student = await db.studentProfile.findUnique({ where: { userId: session.userId } });
      if (!student || student.id !== tuition.studentId) {
        return { success: false, error: "Bạn không có quyền thanh toán khoản học phí này." };
      }
      studentId = student.id;
    } else {
      const parentIds = await resolveParentStudentIds(session.userId);
      if (!parentIds.has(tuition.studentId)) {
        return { success: false, error: "Bạn không có quyền thanh toán khoản học phí này." };
      }
      studentId = tuition.studentId;
    }

    const remaining = dueAmount(tuition.amount, tuition.paid);
    if (remaining <= 0) {
      return { success: false, error: "Học phí này đã được thanh toán đầy đủ." };
    }

    if (!isPayosConfigured()) {
      return { success: false, error: "Thanh toán trực tuyến chưa được cấu hình. Vui lòng quay lại sau." };
    }

    // Sinh orderCode duy nhất (retry tối đa 3 lần nếu trùng).
    let orderCode = generateOrderCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      const exists = await db.paymentLink.findUnique({ where: { orderCode } });
      if (!exists) break;
      orderCode = generateOrderCode();
      if (attempt === 2) {
        return { success: false, error: "Không thể tạo mã đơn hàng. Vui lòng thử lại." };
      }
    }

    const description = buildPaymentDescription(tuition.month, tuition.year, tuition.class?.name ?? "");
    const returnBase = session.role === "PARENT" ? "/parent/payment" : "/student/payment";
    const callbackUrl = `${APP_BASE}${returnBase}?orderCode=${orderCode}`;

    const created = await payos.paymentRequests.create({
      orderCode,
      amount: remaining,
      description,
      cancelUrl: callbackUrl,
      returnUrl: callbackUrl,
      expiredAt: Math.floor(Date.now() / 1000) + PAYOS_EXPIRY_SECONDS,
    });

    await db.paymentLink.create({
      data: {
        orderCode,
        amount: remaining,
        description,
        status: "PENDING",
        checkoutUrl: created.checkoutUrl,
        qrCode: created.qrCode ?? null,
        studentId,
        classId: tuition.classId,
        tuitionId: tuition.id,
        month: tuition.month,
        year: tuition.year,
      },
    });

    return { success: true, checkoutUrl: created.checkoutUrl, qrCode: created.qrCode, orderCode };
  } catch (error) {
    console.error("createPaymentLink error:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tạo đơn thanh toán." };
  }
}

/**
 * Kiểm tra trạng thái thanh toán theo orderCode — fallback khi webhook trễ/lỗi.
 * Nếu PayOS báo PAID, reconcile luôn dữ liệu cục bộ.
 */
export async function checkPaymentStatus(orderCode: number) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STUDENT" && session.role !== "PARENT")) {
      return { success: false, error: "Không có quyền." };
    }

    const link = await db.paymentLink.findUnique({ where: { orderCode } });
    if (!link) return { success: false, error: "Không tìm thấy đơn thanh toán." };

    // Ownership: chỉ chủ sở hữu (student hoặc phụ huynh của student) mới poll được.
    if (session.role === "STUDENT") {
      const student = await db.studentProfile.findUnique({ where: { userId: session.userId } });
      if (!student || student.id !== link.studentId) {
        return { success: false, error: "Bạn không có quyền kiểm tra đơn thanh toán này." };
      }
    } else {
      const parentIds = await resolveParentStudentIds(session.userId);
      if (!parentIds.has(link.studentId)) {
        return { success: false, error: "Bạn không có quyền kiểm tra đơn thanh toán này." };
      }
    }

    if (link.status === "PAID") return { success: true, status: "PAID" as PaymentLinkStatus };

    if (!isPayosConfigured()) {
      return { success: false, error: "Thanh toán trực tuyến chưa được cấu hình." };
    }

    const payosLink = await payos.paymentRequests.get(orderCode);
    if (payosLink.status === "PAID") {
      // Webhook bị trễ/lỗi → reconcile trực tiếp qua API.
      await applyPayosSuccess({
        code: "00",
        desc: "success",
        success: true,
        data: {
          orderCode,
          // amountPaid = số tiền đã thực trả (không phải tổng đơn) — để tính đúng PARTIAL/PAID.
          amount: payosLink.amountPaid ?? payosLink.amount,
          reference: payosLink.transactions?.[0]?.reference,
        },
      });
      revalidatePath("/student/payment");
      revalidatePath("/parent/payment");
      return { success: true, status: "PAID" as PaymentLinkStatus };
    }

    return { success: true, status: (payosLink.status as PaymentLinkStatus) ?? "PENDING" };
  } catch (error) {
    console.error("checkPaymentStatus error:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi kiểm tra thanh toán." };
  }
}
