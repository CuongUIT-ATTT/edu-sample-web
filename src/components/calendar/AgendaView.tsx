"use client";

import { useMemo } from "react";
import { format, isSameDay, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, MapPin } from "lucide-react";
import type { CalendarEvent } from "./CalendarApp";

interface AgendaViewProps {
  startDate: Date;
  days: number;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function AgendaView({ startDate, days, events, onEventClick }: AgendaViewProps) {
  const dateGroups = useMemo(() => {
    const groups: { date: Date; label: string; events: CalendarEvent[] }[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dayEvents = events.filter((e) => isSameDay(e.start, date));

      if (dayEvents.length > 0) {
        let label: string;
        if (isSameDay(date, today)) {
          label = "Hôm nay";
        } else if (isSameDay(addDays(today, 1), date)) {
          label = "Ngày mai";
        } else {
          label = format(date, "EEEE, d MMMM", { locale: vi });
        }
        groups.push({ date, label, events: dayEvents });
      }
    }

    return groups;
  }, [startDate, days, events]);

  if (dateGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-ink-muted-48 text-sm">Không có sự kiện nào trong khoảng thời gian này.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-4">
      {dateGroups.map((group) => (
        <div key={group.date.toISOString()} className="mb-6">
          <h3 className="text-sm font-semibold text-ink mb-3 sticky top-0 bg-canvas py-1">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.events.map((event) => (
              <div
                key={`${event.id}-${event.recurrenceId}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-hairline hover:shadow-sm cursor-pointer transition-shadow"
                onClick={() => onEventClick(event)}
              >
                <div
                  className="w-1 h-12 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: event.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[11px] text-ink-muted-48">
                      <Clock className="w-3 h-3" />
                      {event.isAllDay ? (
                        <span>Cả ngày</span>
                      ) : (
                        <span>
                          {format(event.start, "HH:mm")} – {format(event.end, "HH:mm")}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-[11px] text-ink-muted-48">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-[11px] text-ink-muted-48 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
