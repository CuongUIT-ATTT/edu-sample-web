"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, Eye, EyeOff, Trash2 } from "lucide-react";
import MiniCalendar from "./MiniCalendar";

interface CalendarItem {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  _count?: { events: number };
}

interface CalendarSidebarProps {
  calendars: CalendarItem[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onCalendarToggle: (calendarId: string) => void;
  onCreateCalendar: (name: string, color: string) => void;
  onDeleteCalendar: (calendarId: string) => void;
  onCalendarSelect?: (calendarId: string) => void;
  selectedCalendarId?: string;
}

const CALENDAR_COLORS = [
  "#4285F4", "#EA4335", "#FBBC04", "#34A853",
  "#8E24AA", "#E67C73", "#F6BF26", "#33B679",
];

export default function CalendarSidebar({
  calendars,
  selectedDate,
  onDateSelect,
  onCalendarToggle,
  onCreateCalendar,
  onDeleteCalendar,
  onCalendarSelect,
  selectedCalendarId,
}: CalendarSidebarProps) {
  const [isCalendarsOpen, setIsCalendarsOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#4285F4");

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateCalendar(newName.trim(), newColor);
    setNewName("");
    setNewColor("#4285F4");
    setShowCreate(false);
  };

  return (
    <div className="w-64 shrink-0 border-r border-hairline bg-white h-full flex flex-col overflow-hidden">
      {/* Mini Calendar */}
      <div className="border-b border-hairline">
        <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </div>

      {/* Calendar List */}
      <div className="flex-1 overflow-auto">
        <button
          onClick={() => setIsCalendarsOpen(!isCalendarsOpen)}
          className="flex items-center gap-1.5 w-full px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-pearl"
        >
          {isCalendarsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Lịch của tôi
        </button>

        {isCalendarsOpen && (
          <div className="px-2 space-y-0.5">
            {calendars.map((cal) => (
              <div
                key={cal.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg group cursor-pointer transition-colors
                  ${selectedCalendarId === cal.id ? "bg-surface-pearl" : "hover:bg-surface-pearl/50"}
                `}
                onClick={() => onCalendarSelect?.(cal.id)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onCalendarToggle(cal.id); }}
                  className="shrink-0"
                >
                  {cal.isVisible ? (
                    <Eye className="w-3.5 h-3.5" style={{ color: cal.color }} />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-ink-muted-48" />
                  )}
                </button>
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: cal.color }} />
                <span className="text-xs text-ink truncate flex-1">{cal.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Xóa lịch "${cal.name}"?`)) onDeleteCalendar(cal.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}

            {showCreate ? (
              <div className="px-2 py-1.5 space-y-1.5">
                <input
                  type="text"
                  placeholder="Tên lịch mới"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs border border-hairline rounded px-2 py-1 outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex gap-1">
                  {CALENDAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-4 h-4 rounded-full ${newColor === c ? "ring-2 ring-offset-1" : ""}`}
                      style={{ backgroundColor: c, boxShadow: newColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={handleCreate} className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded">
                    Tạo
                  </button>
                  <button onClick={() => setShowCreate(false)} className="text-[10px] px-2 py-0.5 text-ink-muted-48">
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-1.5 text-xs text-ink-muted-48 hover:text-ink"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm lịch
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
