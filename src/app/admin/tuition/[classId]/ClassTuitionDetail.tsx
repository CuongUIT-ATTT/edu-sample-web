"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, X } from "lucide-react";
import { showToast } from "@/components/Toast";
import { recordPayment } from "@/actions/tuition";

interface TuitionItem {
  id: string;
  studentId: string;
  periods: number;
  amount: number;
  paid: number;
  status: string;
  student: { user: { name: string } };
  payments: { id: string; amount: number; paidAt: string; method: string; note: string | null }[];
}

interface ScheduleItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

interface Props {
  classId: string;
  month: number;
  year: number;
  initialTuition: TuitionItem[];
  schedules: ScheduleItem[];
}

export default function ClassTuitionDetail({ initialTuition, month, year, schedules }: Props) {
  const router = useRouter();
  // tuition = initialTuition (server-rendered, refresh when router.refresh() re-renders)
  const tuition = initialTuition;
  const [payModal, setPayModal] = useState<{ tuitionId: string; studentName: string; owed: number } | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);

  const handleRecordPayment = async () => {
    if (!payModal) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { showToast("Số tiền không hợp lệ", "warning"); return; }

    setPaying(true);
    const res = await recordPayment(payModal.tuitionId, amount, payMethod, payNote);
    if (res.success) {
      showToast("Đã ghi nhận thanh toán!", "success");
      setPayModal(null);
      setPayAmount("");
      setPayNote("");
      router.refresh();
    } else {
      showToast(res.error || "Lỗi", "error");
    }
    setPaying(false);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PAID: "bg-green-50 text-green-700 border-green-200",
      PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
      PENDING: "bg-slate-50 text-slate-500 border-slate-200",
    };
    const labels: Record<string, string> = { PAID: "Đã đóng", PARTIAL: "Đóng một phần", PENDING: "Chưa đóng" };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[status] || colors.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  const totalAmount = tuition.reduce((s, t) => s + t.amount, 0);
  const totalPaid = tuition.reduce((s, t) => s + t.paid, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[10px] text-ink-muted-48 uppercase tracking-wider font-bold">Tổng học phí</span>
          <span className="text-xl font-bold text-ink">{totalAmount.toLocaleString()}đ</span>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[10px] text-ink-muted-48 uppercase tracking-wider font-bold">Đã thu</span>
          <span className="text-xl font-bold text-green-700">{totalPaid.toLocaleString()}đ</span>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[10px] text-ink-muted-48 uppercase tracking-wider font-bold">Còn phải thu</span>
          <span className="text-xl font-bold text-orange-600">{(totalAmount - totalPaid).toLocaleString()}đ</span>
        </div>
      </div>

      {/* Schedules toggle */}
      <button onClick={() => setShowSchedules(!showSchedules)} className="text-xs text-primary hover:underline font-semibold self-start">
        {showSchedules ? "Ẩn" : "Xem"} lịch học tháng {month}/{year} ({schedules.length} buổi)
      </button>

      {showSchedules && (
        <div className="bg-canvas border border-hairline rounded-lg p-4 max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-muted-48 border-b border-divider-soft">
                <th className="text-left py-2 font-semibold">Ngày</th>
                <th className="text-left py-2 font-semibold">Giờ</th>
                <th className="text-left py-2 font-semibold">Phòng</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-divider-soft last:border-0">
                  <td className="py-2">{new Date(s.date).toLocaleDateString("vi-VN")}</td>
                  <td className="py-2">{s.startTime} - {s.endTime}</td>
                  <td className="py-2">{s.room || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tuition table */}
      <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-divider-soft">
          <span className="text-xs font-bold text-ink-muted-48 uppercase tracking-wider">Chi tiết học phí</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-pearl text-ink-muted-48 border-b border-divider-soft">
              <th className="text-left px-4 py-3 font-semibold">Học sinh</th>
              <th className="text-center px-4 py-3 font-semibold">Số tiết</th>
              <th className="text-right px-4 py-3 font-semibold">Học phí</th>
              <th className="text-right px-4 py-3 font-semibold">Đã đóng</th>
              <th className="text-right px-4 py-3 font-semibold">Còn lại</th>
              <th className="text-center px-4 py-3 font-semibold">Trạng thái</th>
              <th className="text-center px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tuition.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-ink-muted-48">Chưa có dữ liệu. Hãy bấm "Tính học phí" ở trang trước.</td></tr>
            ) : tuition.map((t) => (
              <tr key={t.id} className="border-b border-divider-soft last:border-0 hover:bg-surface-pearl/50">
                <td className="px-4 py-3.5 font-semibold text-ink">{t.student.user.name}</td>
                <td className="px-4 py-3.5 text-center text-ink-muted-80">{t.periods}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-ink">{t.amount.toLocaleString()}đ</td>
                <td className="px-4 py-3.5 text-right text-green-700 font-semibold">{t.paid.toLocaleString()}đ</td>
                <td className="px-4 py-3.5 text-right text-orange-600 font-semibold">{Math.max(0, t.amount - t.paid).toLocaleString()}đ</td>
                <td className="px-4 py-3.5 text-center">{statusBadge(t.status)}</td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => setPayModal({ tuitionId: t.id, studentName: t.student.user.name, owed: t.amount - t.paid })}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                  >
                    <DollarSign className="h-3 w-3" /> Thu tiền
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl shadow-product w-full max-w-sm flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider-soft">
              <h3 className="text-sm font-bold text-ink">Ghi nhận thanh toán</h3>
              <button onClick={() => setPayModal(null)} className="h-7 w-7 rounded-md text-ink-muted-80 hover:bg-surface-pearl flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-ink-muted-80">Học sinh: <strong className="text-ink">{payModal.studentName}</strong></p>
              <p className="text-xs text-ink-muted-80">Còn nợ: <strong className="text-orange-600">{payModal.owed.toLocaleString()}đ</strong></p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-ink-muted-48">Số tiền</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-ink-muted-48">Phương thức</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink outline-none">
                  <option value="CASH">Tiền mặt</option>
                  <option value="TRANSFER">Chuyển khoản</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-ink-muted-48">Ghi chú</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} className="bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink outline-none" />
              </div>
              <button onClick={handleRecordPayment} disabled={paying}
                className="bg-primary hover:bg-primary-focus text-white text-xs font-semibold px-4 py-2.5 rounded-pill w-full disabled:opacity-60 flex items-center justify-center gap-1.5">
                {paying && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Xác nhận thu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
