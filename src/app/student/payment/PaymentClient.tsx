"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Receipt, Eye, X } from "lucide-react";
import { createPaymentLink, checkPaymentStatus } from "@/actions/payment";
import { getTuitionDetail, type TuitionDetailRow } from "@/actions/tuition";
import { showToast } from "@/components/Toast";

export interface SerializedTuition {
  id: string;
  month: number;
  year: number;
  periods: number;
  amount: number;
  paid: number;
  status: string;
  payments: {
    id: string;
    method: string;
    amount: number;
    paidAt: string;
  }[];
}

export interface SerializedClass {
  id: string;
  name: string;
  tuitions: SerializedTuition[];
}

interface PaymentClientProps {
  classes: SerializedClass[];
  credits: { classId: string; credit: number }[];
  studentName?: string;
  /** StudentProfile.id — dùng để gọi getTuitionDetail (server action có ownership check). */
  studentId?: string;
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Đã đóng", cls: "bg-green-100 text-green-700" },
  PARTIAL: { label: "Đóng một phần", cls: "bg-amber-100 text-amber-700" },
  PENDING: { label: "Chưa đóng", cls: "bg-slate-100 text-slate-600" },
};

const methodLabel: Record<string, string> = {
  CASH: "Tiền mặt",
  TRANSFER: "Chuyển khoản",
  PAYOS: "PayOS",
};

export default function PaymentClient({
  classes,
  credits,
  studentName,
  studentId,
}: PaymentClientProps) {
  const router = useRouter();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    label: string;
    rows: TuitionDetailRow[];
    totalPeriods: number;
    amount: number;
    feePerPeriod: number;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const creditOf = (classId: string) =>
    credits.find((c) => c.classId === classId)?.credit ?? 0;

  const handleDetail = async (tuitionId: string, cls: SerializedClass, t: SerializedTuition) => {
    if (!studentId) {
      showToast("Không có thông tin học viên.", "error");
      return;
    }
    setLoadingDetail(true);
    const res = await getTuitionDetail(studentId, cls.id, t.month, t.year);
    setLoadingDetail(false);
    if (res.success && res.rows) {
      setDetail({
        label: `Tháng ${t.month}/${t.year} — Lớp ${cls.name}`,
        rows: res.rows,
        totalPeriods: res.totalPeriods ?? 0,
        amount: res.amount ?? 0,
        feePerPeriod: res.feePerPeriod ?? 0,
      });
    } else {
      showToast(res.error || "Không thể tải chi tiết học phí.", "error");
    }
  };

  const handlePay = async (tuitionId: string) => {
    setPayingId(tuitionId);
    const res = await createPaymentLink(tuitionId);
    setPayingId(null);
    if (res.success && res.checkoutUrl) {
      // Redirect sang trang PayOS; sau khi thanh toán quay về returnUrl.
      router.push(res.checkoutUrl);
    } else {
      showToast(res.error || "Đã xảy ra lỗi khi tạo đơn thanh toán.", "error");
    }
  };

  const handleCheck = async (orderCode: number) => {
    setCheckingId(String(orderCode));
    const res = await checkPaymentStatus(orderCode);
    setCheckingId(null);
    if (res.success && res.status === "PAID") {
      showToast("Thanh toán thành công! Học phí đã được cập nhật.", "success");
      router.refresh();
    } else if (res.success) {
      showToast("Đơn hàng chưa được thanh toán.", "info");
    } else {
      showToast(res.error || "Đã xảy ra lỗi khi kiểm tra thanh toán.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {classes.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <Receipt className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="font-body text-ink-muted-80">
            {studentName
              ? `${studentName} chưa thuộc lớp nào.`
              : "Chưa có lớp học."}
          </p>
          <p className="font-caption text-ink-muted-48 text-sm mt-1">
            Liên hệ trung tâm để được xếp lớp và tra cứu học phí.
          </p>
        </div>
      ) : (
        classes.map((cls) => {
          const credit = creditOf(cls.id);
          const due = cls.tuitions.reduce(
            (sum, t) => sum + Math.max(0, t.amount - t.paid),
            0
          );
          return (
            <div
              key={cls.id}
              className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden"
            >
              {/* Class header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface-pearl">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase">
                    Lớp
                  </span>
                  <h3 className="font-body-strong text-sm text-ink">{cls.name}</h3>
                </div>
                <div className="flex items-center gap-4">
                  {credit > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                      Số dư: {credit.toLocaleString("vi-VN")} đ
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      due > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    Còn lại: {due.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              {/* Tuition table */}
              {cls.tuitions.length === 0 ? (
                <p className="px-6 py-6 text-sm text-ink-muted-48 font-caption">
                  Chưa có khoản học phí được tạo cho lớp này.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-hairline text-xs">
                      <th className="text-left px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">
                        Kỳ học phí
                      </th>
                      <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">
                        Số tiết
                      </th>
                      <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">
                        Tổng
                      </th>
                      <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">
                        Đã đóng
                      </th>
                      <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">
                        Còn lại
                      </th>
                      <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="text-right px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cls.tuitions.map((t) => {
                      const remaining = Math.max(0, t.amount - t.paid);
                      const badge = statusBadge[t.status] ?? statusBadge.PENDING;
                      return (
                        <tr
                          key={t.id}
                          className="border-b border-hairline last:border-0 hover:bg-surface-pearl transition-colors"
                        >
                          <td className="px-6 py-3.5">
                            <span className="text-xs font-caption bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                              Tháng {t.month}/{t.year}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs text-ink-muted-80 font-caption">
                            {t.periods}
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs text-ink font-caption-strong">
                            {t.amount.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs text-ink-muted-80 font-caption">
                            {t.paid.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs font-caption-strong">
                            {remaining > 0 ? (
                              <span className="text-amber-600">
                                {remaining.toLocaleString("vi-VN")} đ
                              </span>
                            ) : (
                              <span className="text-green-600">0 đ</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDetail(t.id, cls, t)}
                                disabled={loadingDetail}
                                className="inline-flex items-center gap-1.5 border border-hairline hover:bg-surface-pearl text-ink px-3 py-2 rounded-pill text-xs font-caption-strong transition-colors disabled:opacity-60"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Chi tiết
                              </button>
                              {remaining > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handlePay(t.id)}
                                  disabled={payingId === t.id}
                                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-caption-strong transition-colors apple-active-scale disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {payingId === t.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CreditCard className="h-3.5 w-3.5" />
                                  )}
                                  {payingId === t.id ? "Đang tạo..." : "Thanh toán"}
                                </button>
                              ) : (
                                <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                  ✓ Đã hoàn tất
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}

      {/* Modal chi tiết học phí theo từng buổi */}
      {detail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl shadow-product w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider-soft">
              <h3 className="text-sm font-bold text-ink">Chi tiết buổi học — {detail.label}</h3>
              <button onClick={() => setDetail(null)} aria-label="Đóng" className="p-1.5 rounded-full hover:bg-surface-pearl transition-colors">
                <X className="h-4 w-4 text-ink-muted-48" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex flex-col gap-3">
              {/* Tóm tắt */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs bg-surface-pearl border border-hairline rounded-lg px-4 py-3">
                <span className="text-ink-muted-80">
                  Tổng <strong className="text-ink">{detail.totalPeriods}</strong> tiết
                </span>
                <span className="text-ink-muted-80">
                  <strong className="text-ink">{detail.feePerPeriod.toLocaleString("vi-VN")} đ</strong>/tiết
                </span>
                <span className="text-ink-muted-80">
                  Tổng học phí <strong className="text-ink">{detail.amount.toLocaleString("vi-VN")} đ</strong>
                </span>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-muted-48 border-b border-divider-soft">
                    <th className="text-left py-2 font-semibold">Ngày</th>
                    <th className="text-left py-2 font-semibold">Môn</th>
                    <th className="text-left py-2 font-semibold">Giờ</th>
                    <th className="text-center py-2 font-semibold">Tiết</th>
                    <th className="text-left py-2 font-semibold">Phòng</th>
                    <th className="text-center py-2 font-semibold">Điểm danh</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.rows.map((r, i) => {
                    const statusLabel: Record<string, string> = {
                      PRESENT: "Có mặt",
                      ABSENT: "Vắng",
                      LATE: "Trễ",
                      EXCUSED: "Vắng (phép)",
                      "N/A": "—",
                    };
                    const statusColor: Record<string, string> = {
                      PRESENT: "text-green-600",
                      ABSENT: "text-red-500",
                      LATE: "text-amber-500",
                      EXCUSED: "text-blue-500",
                      "N/A": "text-slate-400",
                    };
                    return (
                      <tr key={i} className="border-b border-divider-soft last:border-0">
                        <td className="py-2 whitespace-nowrap">
                          {new Date(`${r.date}T00:00:00`).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-2">{r.subjectName}</td>
                        <td className="py-2 whitespace-nowrap">{r.startTime} - {r.endTime}</td>
                        <td className="py-2 text-center font-semibold">{r.periods} tiết</td>
                        <td className="py-2">{r.room || "—"}</td>
                        <td className={`py-2 text-center font-semibold ${statusColor[r.status] || "text-slate-400"}`}>
                          {r.status === "N/A" ? "Chưa điểm danh" : statusLabel[r.status] || r.status}
                        </td>
                      </tr>
                    );
                  })}
                  {detail.rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-ink-muted-48">
                        Tháng này chưa có buổi học nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
