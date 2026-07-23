"use client";

import { isSameDay } from "date-fns";
import EventBlock from "./EventBlock";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import type { CalendarEvent } from "./CalendarApp";
import { computeEventColumns } from "./OverlapLayout";

interface TimeGridProps {
  dates: Date[];
  events: CalendarEvent[];
  hourHeight?: number;
  onEventClick: (event: CalendarEvent) => void;
  onEventDragEnd?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64;

function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(e.start, date) && !e.isAllDay);
}

export default function TimeGrid({
  dates,
  events,
  hourHeight = HOUR_HEIGHT,
  onEventClick,
  onEventDragEnd,
}: TimeGridProps) {
  return (
    <div className="flex flex-1 overflow-auto">
      {/* Time labels column */}
      <div className="w-10 md:w-16 shrink-0 border-r border-hairline">
        {HOURS.map((h) => (
          <div
            key={h}
            className="relative border-b border-hairline"
            style={{ height: hourHeight }}
          >
            <span className="absolute -top-2.5 right-1 md:right-2 text-[8px] md:text-[10px] text-ink-muted-48 font-medium">
              {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </span>
          </div>
        ))}
      </div>

      {/* Day columns */}
      {dates.map((date) => {
        const dayEvents = getEventsForDate(events, date);
        const layouted = computeEventColumns(dayEvents);
        const isToday = isSameDay(date, new Date());

        return (
          <div
            key={date.toISOString()}
            className="flex-1 min-w-[120px] border-r border-hairline relative"
          >
            {/* All-day events header */}
            {events
              .filter((e) => isSameDay(e.start, date) && e.isAllDay)
              .map((e) => (
                <div
                  key={`allday-${e.id}-${e.recurrenceId}`}
                  className="text-[10px] font-medium px-1 py-0.5 rounded mb-0.5 mx-1"
                  style={{ backgroundColor: e.color + "22", color: e.color }}
                >
                  {e.title}
                </div>
              ))}

            {/* Hour grid lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-b border-hairline"
                style={{ height: hourHeight }}
              />
            ))}

            {/* Event blocks */}
            {layouted.map((le) => (
              <EventBlock
                key={`${le.event.id}-${le.event.recurrenceId}`}
                event={le.event}
                top={le.topPx}
                height={le.heightPx}
                left={le.leftPercent}
                width={le.widthPercent}
                onClick={onEventClick}
                onDragEnd={onEventDragEnd}
              />
            ))}

            {/* Current time indicator — only on today */}
            {isToday && <CurrentTimeIndicator />}
          </div>
        );
      })}
    </div>
  );
}

export { HOUR_HEIGHT };
