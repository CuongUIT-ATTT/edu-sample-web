"use client";

import { format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import TimeGrid from "./TimeGrid";
import type { CalendarEvent } from "./CalendarApp";

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventDragEnd?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

export default function DayView({ date, events, onEventClick, onEventDragEnd }: DayViewProps) {
  const dayLabel = format(date, "EEEE, d MMMM yyyy", { locale: vi });
  const isToday = isSameDay(date, new Date());

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-hairline bg-surface-pearl/50">
        <h2 className={`text-sm font-semibold ${isToday ? "text-blue-600" : "text-ink"}`}>
          {dayLabel}
        </h2>
      </div>
      <div className="flex-1 overflow-auto">
        <TimeGrid
          dates={[date]}
          events={events}
          onEventClick={onEventClick}
          onEventDragEnd={onEventDragEnd}
        />
      </div>
    </div>
  );
}
