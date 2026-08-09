import React from "react";
import { Wallet, ShieldCheck, QrCode, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PaymentClient, {
  type SerializedClass,
  type SerializedTuition,
} from "@/app/student/payment/PaymentClient";

export const dynamic = "force-dynamic";

export default async function ParentPaymentPage() {
  const session = await getSession();
  if (!session || session.role !== "PARENT") redirect("/login");

  let children: {
    studentId: string;
    name: string;
    classes: SerializedClass[];
    credits: { classId: string; credit: number }[];
  }[] = [];

  try {
    // Chỉ lấy tuition CỦA TỪNG con — KHÔNG đi qua Class.tuitions
    // (Class.tuitions = tuition của mọi học sinh trong lớp → lộ dữ liệu người khác).
    const parentProfile = await db.parentProfile.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        students: {
          select: {
            id: true,
            user: { select: { name: true } },
            classes: { select: { id: true, name: true } },
            credits: true,
          },
        },
      },
    });

    if (parentProfile) {
      children = await Promise.all(
        parentProfile.students.map(async (s) => {
          const tuitions = await db.tuition.findMany({
            where: { studentId: s.id },
            include: { payments: true },
            orderBy: [{ year: "desc" }, { month: "desc" }],
          });
          const tuitionByClass = new Map<string, (typeof tuitions)[number][]>();
          for (const t of tuitions) {
            const list = tuitionByClass.get(t.classId) ?? [];
            list.push(t);
            tuitionByClass.set(t.classId, list);
          }
          return {
            studentId: s.id,
            name: s.user.name,
            classes: s.classes.map((c) => ({
              id: c.id,
              name: c.name,
              tuitions: (tuitionByClass.get(c.id) ?? []).map((t) => ({
                id: t.id,
                month: t.month,
                year: t.year,
                periods: t.periods,
                amount: t.amount,
                paid: t.paid,
                status: t.status,
                payments: t.payments.map((p) => ({
                  id: p.id,
                  method: p.method,
                  amount: p.amount,
                  paidAt: p.paidAt.toISOString(),
                })),
              })),
            })),
            credits: s.credits,
          };
        })
      );
    }
  } catch (error) {
    console.error("Error fetching parent payment data:", error);
  }

  const totalDue = children.reduce(
    (sum, ch) =>
      sum +
      ch.classes.reduce(
        (s, c) =>
          s + c.tuitions.reduce((t2, t) => t2 + Math.max(0, t.amount - t.paid), 0),
        0
      ),
    0
  );

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">
            Học phí & Thanh toán trực tuyến
          </h1>
          <p className="font-caption text-ink-muted-80 mt-1">
            Xem và thanh toán học phí cho con em qua VietQR (PayOS).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700">
          <ShieldCheck className="h-4 w-4" />
          <span>Thanh toán được bảo mật qua PayOS</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-caption-strong text-xs text-ink-muted-80">
              Tổng còn phải đóng (tất cả con)
            </span>
          </div>
          <p className="text-3xl font-bold font-tagline text-ink">
            {totalDue.toLocaleString("vi-VN")}
            <span className="text-sm font-normal text-ink-muted-48"> đ</span>
          </p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <span className="font-caption-strong text-xs text-ink-muted-80">
              Hướng dẫn
            </span>
          </div>
          <p className="text-sm font-caption text-ink-muted-80">
            Bấm nút <strong className="text-ink">Thanh toán</strong> bên cạnh
            khoản học phí, hệ thống sẽ tạo mã VietQR để quét và chuyển khoản.
          </p>
        </div>
      </div>

      {/* Per-child payment cards */}
      {children.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <GraduationCap className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="font-body text-ink-muted-80">
            Bạn chưa liên kết học viên nào.
          </p>
          <p className="font-caption text-ink-muted-48 text-sm mt-1">
            Vui lòng liên hệ trung tâm để liên kết con em.
          </p>
        </div>
      ) : (
        children.map((child) => (
          <div key={child.studentId} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="font-body-strong text-sm text-ink">
                Học viên: {child.name}
              </h2>
            </div>
            <PaymentClient
              classes={child.classes}
              credits={child.credits}
              studentName={child.name}
            />
          </div>
        ))
      )}
    </div>
  );
}
