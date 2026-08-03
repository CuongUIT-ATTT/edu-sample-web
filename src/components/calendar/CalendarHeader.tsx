"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Menu } from "lucide-react";
import { addMonths, addWeeks, addDays, subMonths, subWeeks, subDays } from "date-fns";

type ViewType = "day" | "week" | "month" | "agenda";

interface CalendarHeaderProps {
  currentView: ViewType;
  currentDate: Date;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
  onCreateSchedule?: () => void;
  onToggleSidebar?: () => void;
  role?: string;
}

export default function CalendarHeader({
  currentView,
  currentDate,
  onViewChange,
  onDateChange,
  onToday,
  onCreateSchedule,
  onToggleSidebar,
  role,
}: CalendarHeaderProps) {
  const handlePrev = () => {
    switch (currentView) {
      case "day": onDateChange(subDays(currentDate, 1)); break;
      case "week": onDateChange(subWeeks(currentDate, 1)); break;
      case "month": onDateChange(subMonths(currentDate, 1)); break;
      case "agenda": onDateChange(subMonths(currentDate, 1)); break;
    }
  };

  const handleNext = () => {
    switch (currentView) {
      case "day": onDateChange(addDays(currentDate, 1)); break;
      case "week": onDateChange(addWeeks(currentDate, 1)); break;
      case "month": onDateChange(addMonths(currentDate, 1)); break;
      case "agenda": onDateChange(addMonths(currentDate, 1)); break;
    }
  };

  const dateLabel = (() => {
    switch (currentView) {
      case "day": return format(currentDate, "d MMMM yyyy", { locale: vi });
      case "week": return format(currentDate, "MMMM yyyy", { locale: vi });
      case "month": return format(currentDate, "MMMM yyyy", { locale: vi });
      case "agenda": return format(currentDate, "MMMM yyyy", { locale: vi });
    }
  })();

  const views: { key: ViewType; label: string }[] = [
    { key: "day", label: "Ngày" },
    { key: "week", label: "Tuần" },
    { key: "month", label: "Tháng" },
    { key: "agenda", label: "Lịch trình" },
  ];

  return (
    <div className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 border-b border-hairline bg-white gap-1.5">
      <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
        {/* Mobile: hamburger */}
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className="md:hidden p-1.5 rounded-lg hover:bg-surface-pearl">
            <Menu className="w-5 h-5 text-ink-muted-48" />
          </button>
        )}

        {onCreateSchedule && role !== "STUDENT" && (
          <button
            onClick={onCreateSchedule}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shrink-0"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Đăng ký lịch</span>
          </button>
        )}

        <button
          onClick={onToday}
          className="hidden sm:block px-3 py-1.5 text-sm font-medium border border-hairline rounded-lg hover:bg-surface-pearl transition-colors shrink-0"
        >
          Hôm nay
        </button>

        <div className="flex items-center shrink-0">
          <button onClick={handlePrev} className="p-1 hover:bg-surface-pearl rounded transition-colors">
            <ChevronLeft className="w-5 h-5 text-ink-muted-48" />
          </button>
          <button onClick={handleNext} className="p-1 hover:bg-surface-pearl rounded transition-colors">
            <ChevronRight className="w-5 h-5 text-ink-muted-48" />
          </button>
        </div>

        <h1 className="text-sm md:text-base font-semibold text-ink truncate min-w-0">{dateLabel}</h1>
      </div>

      <div className="flex items-center bg-surface-pearl rounded-lg p-0.5 shrink-0">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            className={`px-1.5 md:px-3 py-1 text-xs md:text-sm rounded-md transition-colors
              ${currentView === v.key
                ? "bg-white text-ink font-medium shadow-sm"
                : "text-ink-muted-48 hover:text-ink"
              }
            `}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
