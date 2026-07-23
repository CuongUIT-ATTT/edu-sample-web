"use client";

import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  differenceInDays,
} from "date-fns";
import { vi } from "date-fns/locale";
import type { CalendarEvent } from "./CalendarApp";

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(e.start, day));
}

export default function MonthView({ date, events, onEventClick, onDateClick }: MonthViewProps) {
  const grid = useMemo(() => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const totalDays = differenceInDays(gridEnd, gridStart) + 1;
    const weeks: Date[][] = [];
    let week: Date[] = [];

    for (let i = 0; i < totalDays; i++) {
      const day = addDays(gridStart, i);
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) weeks.push(week);
    return weeks;
  }, [date]);

  return (
    <div className="flex flex-col h-full">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-hairline bg-surface-pearl/50">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="px-2 py-2 text-[10px] uppercase text-ink-muted-48 font-medium text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="flex-1 overflow-auto">
        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-hairline">
            {week.map((day) => {
              const dayEvents = getEventsForDay(events, day);
              const inMonth = isSameMonth(day, date);
              const today = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[90px] border-r border-hairline px-1 py-1 cursor-pointer
                    ${inMonth ? "" : "bg-canvas-parchment/30"}
                    ${today ? "bg-blue-50/50" : ""}
                    hover:bg-surface-pearl/50 transition-colors
                  `}
                  onClick={() => onDateClick?.(day)}
                >
                  <div className="flex justify-center mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                        ${today ? "bg-blue-600 text-white" : inMonth ? "text-ink" : "text-ink-muted-48"}
                      `}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={`${e.id}-${e.recurrenceId}`}
                        className="text-[10px] font-medium px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: e.color + "22", color: e.color }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEventClick(e);
                        }}
                      >
                        {e.isAllDay ? e.title : `${format(e.start, "HH:mm")} ${e.title}`}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-ink-muted-48 text-center cursor-pointer hover:text-blue-600">
                        +{dayEvents.length - 3} xem thêm
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
