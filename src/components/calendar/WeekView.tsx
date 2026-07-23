"use client";

import { useMemo } from "react";
import { startOfWeek, addDays, format, isSameDay, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import TimeGrid from "./TimeGrid";
import type { CalendarEvent } from "./CalendarApp";

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventDragEnd?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

export default function WeekView({ date, events, onEventClick, onEventDragEnd }: WeekViewProps) {
  const weekDates = useMemo(() => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [date]);

  return (
    <div className="flex flex-col h-full">
      {/* Week header */}
      <div className="flex border-b border-hairline bg-surface-pearl/50">
        <div className="w-16 shrink-0" />
        {weekDates.map((d) => (
          <div
            key={d.toISOString()}
            className={`flex-1 min-w-[120px] px-2 py-2 text-center border-l border-hairline
              ${isToday(d) ? "bg-blue-50" : ""}
            `}
          >
            <p className="text-[10px] uppercase text-ink-muted-48 font-medium">
              {format(d, "EEE", { locale: vi })}
            </p>
            <p
              className={`text-lg font-bold mt-0.5
                ${isToday(d) ? "text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto" : "text-ink"}
              `}
            >
              {format(d, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <TimeGrid
          dates={weekDates}
          events={events}
          onEventClick={onEventClick}
          onEventDragEnd={onEventDragEnd}
        />
      </div>
    </div>
  );
}
