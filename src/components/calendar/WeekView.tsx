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
      {/* Single scroll container — header + grid scroll together horizontally,
          header sticks vertically */}
      <div className="flex-1 overflow-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex bg-surface-pearl/50 border-b border-hairline">
          <div className="w-10 md:w-16 shrink-0" />
          {weekDates.map((d) => (
            <div
              key={d.toISOString()}
              className={`flex-1 min-w-[100px] md:min-w-[120px] px-1 md:px-2 py-1.5 md:py-2 text-center border-l border-hairline
                ${isToday(d) ? "bg-blue-50" : ""}
              `}
            >
              <p className="text-[9px] md:text-[10px] uppercase text-ink-muted-48 font-medium">
                {format(d, "EEE", { locale: vi })}
              </p>
              <p
                className={`text-base md:text-lg font-bold mt-0.5
                  ${isToday(d) ? "text-blue-600 bg-blue-100 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto" : "text-ink"}
                `}
              >
                {format(d, "d")}
              </p>
            </div>
          ))}
        </div>

        {/* Grid — same scroll container */}
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
