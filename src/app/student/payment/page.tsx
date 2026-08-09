import React from "react";
import { Wallet, ShieldCheck, QrCode } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

export default async function StudentPaymentPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  let data: {
    classes: {
      id: string;
      name: string;
      tuitions: {
        id: string;
        month: number;
        year: number;
        periods: number;
        amount: number;
        paid: number;
        status: string;
        payments: { id: string; method: string; amount: number; paidAt: string }[];
      }[];
    }[];
    credits: { classId: string; credit: number }[];
  } | null = null;

  try {
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
      include: {
        classes: {
          include: {
            tuitions: {
              include: { payments: true },
              orderBy: [{ year: "desc" }, { month: "desc" }],
            },
          },
        },
        credits: true,
      },
    });
    if (studentProfile) {
      data = JSON.parse(JSON.stringify(studentProfile));
    }
  } catch (error) {
    console.error("Error fetching student payment data:", error);
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-8 max-w-[1200px]">
        <p className="font-caption text-ink-muted-80">
          Không thể tải thông tin học phí. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  const totalDue = data.classes.reduce(
    (sum, c) =>
      sum +
      c.tuitions.reduce((s, t) => s + Math.max(0, t.amount - t.paid), 0),
    0
  );
  const totalCredit = data.credits.reduce((sum, c) => sum + c.credit, 0);

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">
            Học phí & Thanh toán trực tuyến
          </h1>
          <p className="font-caption text-ink-muted-80 mt-1">
            Xem chi tiết học phí, số dư trả trước và thanh toán qua VietQR
            (PayOS).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700">
          <ShieldCheck className="h-4 w-4" />
          <span>Thanh toán được bảo mật qua PayOS</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-caption-strong text-xs text-ink-muted-80">
              Tổng còn phải đóng
            </span>
          </div>
          <p className="text-3xl font-bold font-tagline text-ink">
            {totalDue.toLocaleString("vi-VN")}
            <span className="text-sm font-normal text-ink-muted-48"> đ</span>
          </p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-5 w-5 text-green-600" />
            <span className="font-caption-strong text-xs text-ink-muted-80">
              Số dư trả trước
            </span>
          </div>
          <p className="text-3xl font-bold font-tagline text-green-600">
            {totalCredit.toLocaleString("vi-VN")}
            <span className="text-sm font-normal text-ink-muted-48"> đ</span>
          </p>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <span className="font-caption-strong text-xs text-ink-muted-80">
              Trạng thái
            </span>
          </div>
          <p className="text-lg font-bold font-tagline text-blue-600">
            Quét mã VietQR để đóng ngay
          </p>
        </div>
      </div>

      {/* Tuition Rows */}
      <PaymentClient
        classes={data.classes}
        credits={data.credits}
        studentName={session.name || "Học viên"}
      />
    </div>
  );
}
