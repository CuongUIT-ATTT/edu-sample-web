"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Calendar, Clock, CalendarDays, CalendarRange, RotateCcw } from "lucide-react";

const QUICK_FILTERS = [
  { label: "Hôm nay", value: "today", icon: Clock },
  { label: "Tuần này", value: "week", icon: CalendarDays },
  { label: "Tháng này", value: "month", icon: Calendar },
];

export default function SystemActivityFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";
  const hasCustom = !!(currentFrom || currentTo);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null) {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleQuickFilter = (value: string) => {
    if (currentPeriod === value && !hasCustom) {
      // Deselect
      setParam({ period: null, from: null, to: null });
    } else {
      setParam({ period: value, from: null, to: null });
    }
  };

  const handleCustomRange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const from = (form.elements.namedItem("from") as HTMLInputElement).value;
    const to = (form.elements.namedItem("to") as HTMLInputElement).value;
    setParam({ period: null, from: from || null, to: to || null });
  };

  const handleReset = () => {
    setParam({ period: null, from: null, to: null });
  };

  const isActive = currentPeriod || hasCustom;

  return (
    <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-ink uppercase tracking-wider">Lọc thời gian</span>
        </div>
        {isActive && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-ink-muted-48 hover:text-red-500 transition-colors"
            title="Xoá bộ lọc"
          >
            <RotateCcw className="h-3 w-3" />
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Quick filter buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(({ label, value, icon: Icon }) => {
          const active = currentPeriod === value && !hasCustom;
          return (
            <button
              key={value}
              onClick={() => handleQuickFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-canvas text-ink-muted-80 border-hairline hover:border-primary hover:text-primary"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Custom date range */}
      <form onSubmit={handleCustomRange} className="flex flex-wrap items-end gap-3 border-t border-divider-soft pt-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-ink-muted-48 uppercase tracking-wider">Từ ngày</label>
          <input
            type="date"
            name="from"
            defaultValue={currentFrom}
            key={currentFrom}
            className="bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-xs text-ink outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-ink-muted-48 uppercase tracking-wider">Đến ngày</label>
          <input
            type="date"
            name="to"
            defaultValue={currentTo}
            key={currentTo}
            className="bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-xs text-ink outline-none focus:border-primary transition-colors"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-focus text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors h-[30px] flex items-center"
        >
          Áp dụng
        </button>
      </form>

      {/* Active filter badge */}
      {isActive && (
        <div className="flex items-center gap-2 text-[11px] text-primary bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
          <CalendarRange className="h-3 w-3" />
          {currentPeriod === "today" && "Đang lọc: Hôm nay"}
          {currentPeriod === "week" && "Đang lọc: Tuần này"}
          {currentPeriod === "month" && "Đang lọc: Tháng này"}
          {hasCustom && `Đang lọc: ${currentFrom || "?"} → ${currentTo || "?"}`}
        </div>
      )}
    </div>
  );
}
