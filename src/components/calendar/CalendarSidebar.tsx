"use client";

import MiniCalendar from "./MiniCalendar";

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

// Sidebar chỉ giữ mini-calendar để điều hướng ngày. Phần "Lịch của tôi/Thêm lịch"
// đã bị xóa (vô dụng: isVisible không persist, không ảnh hưởng lịch học).
export default function CalendarSidebar({
  selectedDate,
  onDateSelect,
}: CalendarSidebarProps) {
  return (
    <div className="w-56 md:w-64 shrink-0 border-r border-hairline bg-white h-full flex flex-col overflow-hidden">
      <div className="border-b border-hairline">
        <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </div>
    </div>
  );
}
