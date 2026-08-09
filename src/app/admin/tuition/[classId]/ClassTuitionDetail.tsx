"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, X, Eye, Clock } from "lucide-react";
import { showToast } from "@/components/Toast";
import { recordPayment } from "@/actions/tuition";
import { toLocalDateStr } from "@/lib/schedule-expand";

interface TuitionItem {
  id: string;
  studentId: string;
  periods: number;
  amount: number;
  paid: number;
  status: string;
  student: { user: { name: string }; credits: { credit: number }[] };
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
  fromMonth: number;
  toMonth: number;
  year: number;
  initialTuition: TuitionItem[];
  schedules: ScheduleItem[];
}

export default function ClassTuitionDetail({ initialTuition, fromMonth, toMonth, year, schedules }: Props) {
  const router = useRouter();
  // tuition = initialTuition (server-rendered, refresh when router.refresh() re-renders)
  const tuition = initialTuition;
  const [payModal, setPayModal] = useState<{ tuitionId: string; studentName: string; owed: number; credit: number } | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [detail, setDetail] = useState<{ name: string; rows: { date: string; start: string; end: string; room: string; status: string }[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ name: string; payments: TuitionItem['payments'] } | null>(null);

  const loadDetail = async (studentId: string, studentName: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/attendance?studentId=${studentId}&from=${fromMonth}&to=${toMonth}&year=${year}`);
      const data = await res.json();
      const attendance = data?.records || [];

      const rows = schedules.map((s) => {
        // s.date đã là "YYYY-MM-DD" (page.tsx dùng dateToUtcStr). Attendance a.date là ISO string
        // (Prisma serialize UTC) nhưng được lưu local midnight → lấy ngày local bằng toLocalDateStr
        // để khớp, KHÔNG dùng toISOString().split("T")[0] (lệch 1 ngày ở TZ +07).
        const att = attendance.find((a: { date: string; status: string }) => toLocalDateStr(new Date(a.date)) === s.date);
        return {
          date: s.date,
          start: s.startTime,
          end: s.endTime,
          room: s.room || "—",
          status: att ? att.status : "N/A",
        };
      });

      setDetail({ name: studentName, rows });
    } catch {
      showToast("Không thể tải chi tiết", "error");
    }
    setLoadingDetail(false);
  };

  const handleRecordPayment = async () => {
    if (!payModal) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) { showToast("Số tiền không hợp lệ", "warning"); return; }

    setPaying(true);
    const res = await recordPayment(payModal.tuitionId, amount, payMethod, payNote);
    if (res.success) {
      const surplus = res.surplus ?? 0;
      const msg = surplus > 0
        ? `Đã ghi nhận ${amount.toLocaleString()}đ — dư ${surplus.toLocaleString()}đ thành số dư trả trước!`
        : "Đã ghi nhận thanh toán!";
      showToast(msg, "success");
      setPayModal(null);
      setConfirmModal(false);
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

  // Số dư trả trước theo cặp (học sinh, lớp) — lấy từ row đầu tiên của mỗi student
  const creditByStudent = new Map<string, number>();
  for (const t of tuition) {
    if (!creditByStudent.has(t.studentId)) {
      creditByStudent.set(t.studentId, t.student.credits?.[0]?.credit ?? 0);
    }
  }

  // Aggregate tuition records by studentId (sum periods/amount across months)
  const aggregated: Record<string, TuitionItem> = {};
  for (const t of tuition) {
    const sid = t.studentId;
    if (!aggregated[sid]) {
      aggregated[sid] = { ...t, periods: 0, amount: 0, paid: 0, payments: [] as TuitionItem['payments'] };
    }
    aggregated[sid].periods += t.periods;
    aggregated[sid].amount += t.amount;
    aggregated[sid].paid += t.paid;
    aggregated[sid].payments.push(...t.payments);
  }
  const aggList = Object.values(aggregated);

  const totalAmount = aggList.reduce((s, t) => s + t.amount, 0);
  const totalPaid = aggList.reduce((s, t) => s + t.paid, 0);
  const totalCredit = aggList.reduce((s, t) => s + (creditByStudent.get(t.studentId) ?? 0), 0);

  // Hàm mở modal thu tiền: chọn tuitionId của row còn nợ sớm nhất; nếu đã đóng hết thì dùng row mới nhất (tạo credit)
  const openPayModal = (item: TuitionItem) => {
    const rows = tuition.filter((t) => t.studentId === item.studentId);
    const owing = rows.find((r) => r.amount - r.paid > 0);
    const target = owing ?? rows[rows.length - 1];
    if (!target) return;
    setPayModal({
      tuitionId: target.id,
      studentName: item.student.user.name,
      owed: Math.max(0, target.amount - target.paid),
      credit: creditByStudent.get(item.studentId) ?? 0,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[10px] text-ink-muted-48 uppercase tracking-wider font-bold">Tổng học phí</span>
          <span className="text-xl font-bold text-ink">{totalAmount.toLocaleString()}đ</span>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[10px] text-ink-muted-48 uppercase tracking-wider font-bold">Đã thu</span>
          <span className="text-xl font-bold text-green-700">{totalPaid.toLocaleString()}đ</span>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[10px] text-ink-muted-48 uppercase tracking-wider font-bold">Tiền dư trả trước</span>
          <span className="text-xl font-bold text-teal-600">{totalCredit.toLocaleString()}đ</span>
          <span className="text-[10px] text-ink-muted-48">sẽ tự trừ vào kỳ sau</span>
        </div>
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-1">
          <span className="text-[10px] text-ink-muted-48 uppercase tracking-wider font-bold">Còn phải thu</span>
          <span className="text-xl font-bold text-orange-600">{Math.max(0, totalAmount - totalPaid - totalCredit).toLocaleString()}đ</span>
        </div>
      </div>

      {/* Schedules toggle */}
      <button onClick={() => setShowSchedules(!showSchedules)} className="text-xs text-primary hover:underline font-semibold self-start">
        {showSchedules ? "Ẩn" : "Xem"} lịch học tháng {fromMonth === toMonth ? `${fromMonth}` : `${fromMonth}→${toMonth}`}/{year} ({schedules.length} buổi)
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

      {/* Tuition table - desktop */}
      <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-divider-soft">
          <span className="text-xs font-bold text-ink-muted-48 uppercase tracking-wider">Chi tiết học phí</span>
        </div>
        {/* Desktop table */}
        <table className="w-full text-xs hidden md:table">
          <thead>
            <tr className="bg-surface-pearl text-ink-muted-48 border-b border-divider-soft">
              <th className="text-left px-4 py-3 font-semibold">Học sinh</th>
              <th className="text-center px-4 py-3 font-semibold">Số tiết</th>
              <th className="text-right px-4 py-3 font-semibold">Học phí</th>
              <th className="text-right px-4 py-3 font-semibold">Đã đóng</th>
              <th className="text-right px-4 py-3 font-semibold">Còn lại</th>
              <th className="text-center px-4 py-3 font-semibold">Trạng thái</th>
              <th className="text-center px-4 py-3 font-semibold" colSpan={3}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {aggList.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-ink-muted-48">Chưa có dữ liệu. Hãy bấm "Tính học phí" ở trang trước.</td></tr>
            ) : aggList.map((item) => {
              const credit = creditByStudent.get(item.studentId) ?? 0;
              return (
              <tr key={item.id} className="border-b border-divider-soft last:border-0 hover:bg-surface-pearl/50">
                <td className="px-4 py-3.5 font-semibold text-ink">{item.student.user.name}</td>
                <td className="px-4 py-3.5 text-center text-ink-muted-80">{item.periods}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-ink">{item.amount.toLocaleString()}đ</td>
                <td className="px-4 py-3.5 text-right text-green-700 font-semibold">{item.paid.toLocaleString()}đ</td>
                <td className="px-4 py-3.5 text-right text-orange-600 font-semibold">{Math.max(0, item.amount - item.paid).toLocaleString()}đ</td>
                <td className="px-4 py-3.5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    {statusBadge(item.status)}
                    {credit > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-300 text-teal-700 bg-teal-50">
                        Có dư {credit.toLocaleString()}đ — trừ vào kỳ sau
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => loadDetail(item.studentId, item.student.user.name)}
                    disabled={loadingDetail}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                    title="Xem chi tiết buổi học"
                  >
                    <Eye className="h-3 w-3" /> Chi tiết
                  </button>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => setHistoryModal({ name: item.student.user.name, payments: item.payments })}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Lịch sử đóng tiền"
                  >
                    <Clock className="h-3 w-3" /> Lịch sử
                  </button>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => openPayModal(item)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                  >
                    <DollarSign className="h-3 w-3" /> Thu tiền
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {/* Mobile card list */}
        <div className="md:hidden flex flex-col gap-3 p-4">
          {aggList.length === 0 ? (
            <p className="text-center py-8 text-ink-muted-48 text-xs">Chưa có dữ liệu. Hãy bấm "Tính học phí" ở trang trước.</p>
          ) : aggList.map((item) => {
            const credit = creditByStudent.get(item.studentId) ?? 0;
            return (
            <div key={item.id} className="border border-hairline rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-ink truncate">{item.student.user.name}</span>
                <div className="flex flex-col items-end gap-1">
                  {statusBadge(item.status)}
                  {credit > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-300 text-teal-700 bg-teal-50">
                      Có dư {credit.toLocaleString()}đ
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-ink-muted-48">Số tiết</span>
                  <span className="font-semibold text-ink">{item.periods}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-ink-muted-48">Học phí</span>
                  <span className="font-semibold text-ink">{item.amount.toLocaleString()}đ</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-ink-muted-48">Đã đóng</span>
                  <span className="font-semibold text-green-700">{item.paid.toLocaleString()}đ</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-ink-muted-48">Còn lại</span>
                  <span className="font-semibold text-orange-600">{Math.max(0, item.amount - item.paid).toLocaleString()}đ</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-divider-soft">
                <button onClick={() => loadDetail(item.studentId, item.student.user.name)} disabled={loadingDetail}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-full border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors">
                  <Eye className="h-3 w-3" /> Chi tiết
                </button>
                <button onClick={() => setHistoryModal({ name: item.student.user.name, payments: item.payments })}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors">
                  <Clock className="h-3 w-3" /> Lịch sử
                </button>
                <button onClick={() => openPayModal(item)}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors">
                  <DollarSign className="h-3 w-3" /> Thu tiền
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl shadow-product w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider-soft">
              <h3 className="text-sm font-bold text-ink">Chi tiết buổi học - {detail.name}</h3>
              <button onClick={() => setDetail(null)} className="h-7 w-7 rounded-md text-ink-muted-80 hover:bg-surface-pearl flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex flex-col gap-3">
              <div className="text-[10px] text-ink-muted-48 flex flex-wrap gap-x-4 gap-y-1">
                <span>Tháng {fromMonth === toMonth ? fromMonth : `${fromMonth}→${toMonth}`}/{year}</span>
                <span>Số buổi: <strong>{detail.rows.length}</strong></span>
                <span>Tổng tiết từ lịch: <strong>{detail.rows.reduce((s, r) => { const [sh,sm]=r.start.split(":").map(Number); const [eh,em]=r.end.split(":").map(Number); return s + Math.max(1, Math.round(((eh*60+em)-(sh*60+sm))/45)); }, 0)} tiết</strong></span>
                <span>Giá: {new Intl.NumberFormat().format(18000)}đ/tiết</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-muted-48 border-b border-divider-soft">
                    <th className="text-left py-2 font-semibold">Ngày</th>
                    <th className="text-left py-2 font-semibold">Giờ</th>
                    <th className="text-left py-2 font-semibold">Số tiết</th>
                    <th className="text-left py-2 font-semibold">Phòng</th>
                    <th className="text-center py-2 font-semibold">Điểm danh</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.rows.map((r, i) => {
                    let periodCount = 0;
                    const [sh, sm] = r.start.split(":").map(Number);
                    const [eh, em] = r.end.split(":").map(Number);
                    const mins = (eh * 60 + em) - (sh * 60 + sm);
                    periodCount = Math.max(1, Math.round(mins / 45));
                    const statusLabel: Record<string, string> = { PRESENT: "Có mặt", ABSENT: "Vắng", LATE: "Trễ", EXCUSED: "Vắng (phép)", "N/A": "—" };
                    const statusColor: Record<string, string> = { PRESENT: "text-green-600", ABSENT: "text-red-500", LATE: "text-amber-500", EXCUSED: "text-blue-500", "N/A": "text-slate-400" };
                    return (
                      <tr key={i} className="border-b border-divider-soft last:border-0">
                        <td className="py-2">{new Date(r.date + "T00:00:00").toLocaleDateString("vi-VN")}</td>
                        <td className="py-2">{r.start} - {r.end}</td>
                        <td className="py-2 font-semibold">{periodCount} tiết</td>
                        <td className="py-2">{r.room}</td>
                        <td className={`py-2 text-center font-semibold ${statusColor[r.status] || "text-slate-400"}`}>
                          {r.status === "N/A" ? "Chưa điểm danh" : statusLabel[r.status] || r.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl shadow-product w-full max-w-sm flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider-soft">
              <h3 className="text-sm font-bold text-ink">Lịch sử đóng tiền - {historyModal.name}</h3>
              <button onClick={() => setHistoryModal(null)} className="h-7 w-7 rounded-md text-ink-muted-80 hover:bg-surface-pearl flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {historyModal.payments.length === 0 ? (
                <p className="text-xs text-ink-muted-48 text-center py-4">Chưa có lịch sử thanh toán.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="text-ink-muted-48 border-b border-divider-soft">
                    <th className="text-left py-2 font-semibold">Ngày</th>
                    <th className="text-right py-2 font-semibold">Số tiền</th>
                    <th className="text-center py-2 font-semibold">PTTT</th>
                    <th className="text-left py-2 font-semibold">Ghi chú</th>
                  </tr></thead>
                  <tbody>
                    {historyModal.payments.map((pmt: { id: string; amount: number; paidAt: string; method: string; note: string | null }) => (
                      <tr key={pmt.id} className="border-b border-divider-soft last:border-0">
                        <td className="py-2">{new Date(pmt.paidAt).toLocaleDateString("vi-VN")}</td>
                        <td className="py-2 text-right font-semibold text-green-700">{pmt.amount.toLocaleString()}đ</td>
                        <td className="py-2 text-center">{pmt.method === "CASH" ? "Tiền mặt" : pmt.method === "PAYOS" ? "PayOS" : "CK"}</td>
                        <td className="py-2 text-ink-muted-48">{pmt.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

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
              {payModal.credit > 0 && (
                <p className="text-xs text-ink-muted-80">
                  Số dư trả trước: <strong className="text-teal-700">{payModal.credit.toLocaleString()}đ</strong>{" "}
                  <span className="text-ink-muted-48">— sẽ tự trừ khi tính kỳ sau</span>
                </p>
              )}
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
              <button
                onClick={() => {
                  const amount = parseFloat(payAmount);
                  if (isNaN(amount) || amount <= 0) { showToast("Số tiền không hợp lệ", "warning"); return; }
                  setConfirmModal(true);
                }}
                disabled={paying}
                className="bg-primary hover:bg-primary-focus text-white text-xs font-semibold px-4 py-2.5 rounded-pill w-full disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {paying && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Xác nhận thu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {confirmModal && payModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl shadow-product w-full max-w-sm flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-divider-soft">
              <h3 className="text-sm font-bold text-ink">Xác nhận thu tiền</h3>
              <button onClick={() => setConfirmModal(false)} className="h-7 w-7 rounded-md text-ink-muted-80 hover:bg-surface-pearl flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-ink-muted-80">Học sinh: <strong className="text-ink">{payModal.studentName}</strong></p>
              <p className="text-xs text-ink-muted-80">
                Số tiền thu: <strong className="text-green-700">{parseFloat(payAmount).toLocaleString()}đ</strong>
              </p>
              <p className="text-xs text-ink-muted-80">
                Phương thức: <strong className="text-ink">{payMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}</strong>
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setConfirmModal(false)}
                  disabled={paying}
                  className="flex-1 border border-hairline hover:bg-surface-pearl text-ink-muted-80 text-xs font-semibold px-4 py-2.5 rounded-pill disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={paying}
                  className="flex-1 bg-primary hover:bg-primary-focus text-white text-xs font-semibold px-4 py-2.5 rounded-pill disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {paying && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
