"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Trash2, Clock, MapPin, Bell, Repeat } from "lucide-react";
import type { CalendarEvent } from "./CalendarApp";

interface EventModalProps {
  event?: CalendarEvent | null;
  initialStart?: Date;
  initialEnd?: Date;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => void;
  onDelete?: (eventId: string) => void;
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  color: string;
  recurrenceType: string;
  reminderMinutes: number[];
}

const COLORS = [
  "#4285F4", "#EA4335", "#FBBC04", "#34A853",
  "#8E24AA", "#E67C73", "#F6BF26", "#33B679",
  "#039BE5", "#7986CB", "#616161", "#D50000",
];

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "Không lặp" },
  { value: "DAILY", label: "Hàng ngày" },
  { value: "WEEKLY", label: "Hàng tuần" },
  { value: "MONTHLY", label: "Hàng tháng" },
  { value: "YEARLY", label: "Hàng năm" },
];

const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60, 1440];

export default function EventModal({
  event,
  initialStart,
  initialEnd,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState("#4285F4");
  const [recurrenceType, setRecurrenceType] = useState("NONE");
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([]);
  const [showReminders, setShowReminders] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setLocation(event.location ?? "");
      setStartTime(format(event.start, "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(event.end, "yyyy-MM-dd'T'HH:mm"));
      setIsAllDay(event.isAllDay);
      setColor(event.color);
      setRecurrenceType(event.recurrenceRule ? "WEEKLY" : "NONE");
    } else if (initialStart && initialEnd) {
      setStartTime(format(initialStart, "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(initialEnd, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [event, initialStart, initialEnd]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({
      title,
      description,
      location,
      startTime,
      endTime,
      isAllDay,
      color,
      recurrenceType,
      reminderMinutes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hairline">
          <h3 className="text-base font-semibold text-ink">
            {event ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
          </h3>
          <div className="flex items-center gap-2">
            {event && onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted-48 hover:bg-surface-pearl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <input
            type="text"
            placeholder="Thêm tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-medium text-ink placeholder:text-ink-muted-48 bg-transparent outline-none border-b border-hairline focus:border-blue-500 pb-2"
            autoFocus
          />

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            Cả ngày
          </label>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink-muted-48 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type={isAllDay ? "date" : "datetime-local"}
                value={isAllDay ? startTime.split("T")[0] : startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
              />
              <span className="text-ink-muted-48 text-sm">→</span>
              <input
                type={isAllDay ? "date" : "datetime-local"}
                value={isAllDay ? endTime.split("T")[0] : endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1 text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-ink-muted-48 shrink-0" />
            <input
              type="text"
              placeholder="Thêm địa điểm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
            />
          </div>

          <textarea
            placeholder="Thêm mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full text-sm border border-hairline rounded-lg px-3 py-2 outline-none focus:border-blue-500 resize-none"
          />

          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-muted-48 shrink-0">Màu:</span>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-1" : "hover:scale-110"}`}
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-ink-muted-48 shrink-0" />
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={() => setShowReminders(!showReminders)}
              className="flex items-center gap-2 text-sm text-ink-muted-48 hover:text-ink transition-colors"
            >
              <Bell className="w-4 h-4" />
              Nhắc nhở ({reminderMinutes.length})
            </button>
            {showReminders && (
              <div className="mt-2 flex flex-wrap gap-2">
                {REMINDER_OPTIONS.map((min) => (
                  <button
                    key={min}
                    onClick={() => {
                      setReminderMinutes((prev) =>
                        prev.includes(min) ? prev.filter((m) => m !== min) : [...prev, min].sort((a, b) => a - b)
                      );
                    }}
                    className={`text-[11px] px-2 py-1 rounded-full border transition-colors
                      ${reminderMinutes.includes(min)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "border-hairline text-ink-muted-48 hover:border-blue-200"
                      }
                    `}
                  >
                    {min === 0 ? "Khi bắt đầu" : min < 60 ? `${min} phút` : `${min / 60} giờ`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-hairline">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-lg border border-hairline text-ink hover:bg-surface-pearl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {event ? "Cập nhật" : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}
