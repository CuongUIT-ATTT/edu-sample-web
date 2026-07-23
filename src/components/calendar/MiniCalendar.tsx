"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format,
  isSameDay, isSameMonth, isToday, addMonths, subMonths, differenceInDays,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(selectedDate);

  const grid = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const totalDays = differenceInDays(gridEnd, gridStart) + 1;
    const weeks: Date[][] = [];
    let week: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      week.push(addDays(gridStart, i));
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) weeks.push(week);
    return weeks;
  }, [viewMonth]);

  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1 hover:bg-surface-pearl rounded">
          <ChevronLeft className="w-3.5 h-3.5 text-ink-muted-48" />
        </button>
        <span className="text-xs font-semibold text-ink">{format(viewMonth, "MMMM yyyy", { locale: vi })}</span>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1 hover:bg-surface-pearl rounded">
          <ChevronRight className="w-3.5 h-3.5 text-ink-muted-48" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <div key={d} className="text-center text-[9px] text-ink-muted-48 font-medium py-0.5">{d}</div>
        ))}
      </div>
      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((day) => {
            const inMonth = isSameMonth(day, viewMonth);
            const today = isToday(day);
            const selected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={`w-7 h-7 flex items-center justify-center text-[11px] rounded-full mx-auto transition-colors
                  ${!inMonth ? "text-ink-muted-48/40" : "text-ink"}
                  ${today && !selected ? "bg-blue-100 text-blue-700 font-semibold" : ""}
                  ${selected ? "bg-blue-600 text-white font-semibold" : "hover:bg-surface-pearl"}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
