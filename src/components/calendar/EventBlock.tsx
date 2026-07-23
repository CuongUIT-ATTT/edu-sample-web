"use client";

import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Clock, MapPin, Repeat, GripVertical } from "lucide-react";
import type { CalendarEvent } from "./CalendarApp";

interface EventBlockProps {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  onClick: (event: CalendarEvent) => void;
  onDragEnd?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

export default function EventBlock({
  event,
  top,
  height,
  left,
  width,
  onClick,
  onDragEnd,
}: EventBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startTop: number }>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onDragEnd) return;
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = { startY: e.clientY, startTop: top };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const delta = ev.clientY - dragRef.current.startY;
        const el = document.getElementById(
          `event-block-${event.id}-${event.recurrenceId}`
        );
        if (el) el.style.top = `${dragRef.current.startTop + delta}px`;
      };

      const handleMouseUp = (ev: MouseEvent) => {
        setIsDragging(false);
        const savedRef = dragRef.current;
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        if (onDragEnd && savedRef) {
          const delta = ev.clientY - savedRef.startY;
          const minutesDelta = Math.round((delta / 64) * 60);
          const newStart = new Date(event.start.getTime() + minutesDelta * 60000);
          const newEnd = new Date(event.end.getTime() + minutesDelta * 60000);
          onDragEnd(event, newStart, newEnd);
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [event, top, onDragEnd]
  );

  const timeStr = `${format(event.start, "HH:mm")} – ${format(event.end, "HH:mm")}`;
  const isSmall = height < 50;

  return (
    <div
      id={`event-block-${event.id}-${event.recurrenceId}`}
      className={`absolute rounded-md border px-1.5 py-0.5 cursor-pointer select-none overflow-hidden
        transition-shadow hover:shadow-md group
        ${isDragging ? "z-40 shadow-lg opacity-90" : "z-10"}
      `}
      style={{
        top,
        height: Math.max(height, 20),
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: event.color + "22",
        borderColor: event.color,
        borderLeftWidth: 3,
      }}
      onClick={() => onClick(event)}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start gap-0.5">
        <GripVertical className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-40 shrink-0 cursor-grab" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate" style={{ color: event.color }}>
            {event.title}
          </p>
          {!isSmall && (
            <div className="flex items-center gap-1 text-[10px] text-ink-muted-80">
              <Clock className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{timeStr}</span>
            </div>
          )}
          {!isSmall && event.location && (
            <div className="flex items-center gap-1 text-[10px] text-ink-muted-48">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.isRecurrenceInstance && (
            <Repeat className="w-2.5 h-2.5 text-ink-muted-48 mt-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
