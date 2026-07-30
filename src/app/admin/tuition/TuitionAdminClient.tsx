"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Calculator, Users, ChevronRight, CalendarRange, Download } from "lucide-react";
import { showToast } from "@/components/Toast";
import { calculateTuition, calculateMultipleMonths, updateFeeSettings, exportTuitionCSV } from "@/actions/tuition";

interface ClassItem { id: string; name: string; _count: { students: number } }
interface Props { classes: ClassItem[]; initialPrice: number }

export default function TuitionAdminClient({ classes, initialPrice }: Props) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [calculating, setCalculating] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [priceInput, setPriceInput] = useState(String(initialPrice));
  const [batchMonthFrom, setBatchMonthFrom] = useState(1);
  const [batchMonthTo, setBatchMonthTo] = useState(now.getMonth() + 1);
  const [batchProcessing, setBatchProcessing] = useState<string | null>(null);

  const handleCalculate = async (id: string, name: string) => {
    setCalculating(id);
    const res = await calculateTuition(id, month, year);
    showToast(res.success ? `Đã tính học phí tháng ${month}/${year} - ${name}` : res.error || "Lỗi", res.success ? "success" : "error");
    setCalculating(null);
  };

  const handleBatchCalculate = async (id: string, name: string) => {
    const months = [];
    for (let m = batchMonthFrom; m <= batchMonthTo; m++) months.push(m);
    setBatchProcessing(id);
    const res = await calculateMultipleMonths(id, months, year);
    if (res.success) showToast(`Đã tính ${months.length} tháng cho ${name}!`, "success");
    else showToast(res.error || "Lỗi", "error");
    setBatchProcessing(null);
  };

  const handleExportCSV = async (id: string, name: string) => {
    const months = [];
    for (let m = batchMonthFrom; m <= batchMonthTo; m++) months.push(m);
    const res = await exportTuitionCSV(id, months, year);
    if (res.success && res.csv) {
      const a = document.createElement("a");
      a.href = res.csv;
      a.download = res.filename || `hoc_phi_${name}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Đã xuất CSV ${name}!`, "success");
    } else showToast(res.error || "Lỗi xuất CSV", "error");
  };

  const handleUpdatePrice = async () => {
    const val = parseInt(priceInput);
    if (isNaN(val) || val < 1000) { showToast("Giá không hợp lệ", "warning"); return; }
    const res = await updateFeeSettings(val);
    if (res.success) { showToast("Đã cập nhật giá!", "success"); setShowSettings(false); router.refresh(); }
    else showToast(res.error || "Lỗi", "error");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-muted-48">Tháng</span>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-xs text-ink outline-none">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-muted-48">Năm</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-xs text-ink outline-none">
            {Array.from({ length: 5 }, (_, i) => <option key={i} value={2024 + i}>{2024 + i}</option>)}
          </select>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-hairline hover:bg-surface-pearl transition-colors text-ink-muted-80">
          <Settings className="h-3.5 w-3.5" /> Cài đặt giá
        </button>
      </div>

      {showSettings && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col gap-3">
          <span className="text-xs font-bold text-ink">Giá mỗi tiết học (45 phút)</span>
          <div className="flex gap-2">
            <input type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)} className="bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink outline-none w-40" min={1000} step={1000} />
            <span className="text-xs text-ink-muted-48 self-center">VNĐ</span>
            <button onClick={handleUpdatePrice} className="bg-primary hover:bg-primary-focus text-white px-4 py-1.5 rounded-lg text-xs font-semibold">Lưu</button>
          </div>
        </div>
      )}

      {/* Batch range selector */}
      <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-wrap items-center gap-4">
        <CalendarRange className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-ink">Tính theo khoảng tháng:</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-ink-muted-48">Từ</span>
          <select value={batchMonthFrom} onChange={e => setBatchMonthFrom(Number(e.target.value))} className="bg-canvas border border-hairline rounded-lg px-2 py-1 text-[10px] text-ink outline-none">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
          </select>
          <span className="text-[10px] text-ink-muted-48">đến</span>
          <select value={batchMonthTo} onChange={e => setBatchMonthTo(Number(e.target.value))} className="bg-canvas border border-hairline rounded-lg px-2 py-1 text-[10px] text-ink outline-none">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-divider-soft">
          <span className="text-xs font-bold text-ink-muted-48 uppercase tracking-wider">Danh sách lớp ({classes.length})</span>
        </div>
        {classes.map(cls => (
          <div key={cls.id} className="flex items-center justify-between px-5 py-4 border-b border-divider-soft last:border-0 hover:bg-surface-pearl/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center"><Users className="h-4 w-4" /></div>
              <div>
                <span className="text-sm font-semibold text-ink">{cls.name}</span>
                <p className="text-[11px] text-ink-muted-48">{cls._count.students} học sinh</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleCalculate(cls.id, cls.name)} disabled={calculating === cls.id}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-hairline hover:bg-surface-pearl transition-colors text-ink-muted-80 disabled:opacity-50">
                {calculating === cls.id ? <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
                Tính tháng {month}
              </button>
              <button onClick={() => handleBatchCalculate(cls.id, cls.name)} disabled={batchProcessing === cls.id}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors disabled:opacity-50">
                {batchProcessing === cls.id ? <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <CalendarRange className="h-3.5 w-3.5" />}
                Tính {batchMonthFrom}-{batchMonthTo}
              </button>
              <button onClick={() => handleExportCSV(cls.id, cls.name)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button onClick={() => router.push(`/admin/tuition/${cls.id}?month=${month}&year=${year}`)}
                className="h-8 w-8 rounded-lg border border-hairline hover:bg-surface-pearl flex items-center justify-center transition-colors">
                <ChevronRight className="h-4 w-4 text-ink-muted-48" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
