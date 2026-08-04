"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import CalendarHeader from "./CalendarHeader";
import CalendarSidebar from "./CalendarSidebar";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import AgendaView from "./AgendaView";
import EventModal, { type EventFormData } from "./EventModal";
import ScheduleModal from "./ScheduleModal";
import SessionDetailModal from "./SessionDetailModal";
import { getCalendars, getEvents, getSchedulesForCalendar, createEvent, updateEvent, deleteEvent, createCalendar, deleteCalendar, type ScheduleEventDisplay } from "@/actions/calendar";
import { createRecurrenceRule } from "@/lib/recurrence";
import { showToast } from "@/components/Toast";

export type ViewType = "day" | "week" | "month" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date;
  isAllDay: boolean;
  timezone: string;
  color: string;
  status: string;
  calendarId: string;
  ownerId: string;
  recurrenceRule: string | null;
  recurrenceId: string;
  isException: boolean;
  isRecurrenceInstance: boolean;
  originalEventId: string;
  isSchedule?: boolean;
  scheduleMeta?: ScheduleEventDisplay["scheduleMeta"];
  reminders: Array<{ id: string; method: string; minutesBefore: number }>;
  participants: Array<{
    id: string;
    userId: string;
    responseStatus: string;
    role: string;
    user: { id: string; name: string; email: string };
  }>;
}

interface CalendarItem {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  _count?: { events: number };
}

interface CalendarAppProps {
  userId: string;
  userName: string;
  role: string;
  teacherProfileId?: string | null;
  studentClassIds?: string[];
  classes?: { id: string; name: string }[];
  subjects?: { id: string; name: string; code: string }[];
  teachers?: { id: string; user: { name: string } }[];
  rooms?: { id: string; name: string; capacity?: number | null }[];
}

export default function CalendarApp({
  userId, userName, role, teacherProfileId, studentClassIds = [],
  classes = [], subjects = [], teachers = [], rooms = [],
}: CalendarAppProps) {
  const [currentView, setCurrentView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialStart, setInitialStart] = useState<Date | undefined>();
  const [initialEnd, setInitialEnd] = useState<Date | undefined>();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<CalendarEvent | null>(null);
  const [editScheduleData, setEditScheduleData] = useState<Record<string, unknown> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // refreshKey: đổi giá trị → trigger load lại events (sau create/update/delete/drag). Cơ chế re-fetch duy nhất.
  const [refreshKey, setRefreshKey] = useState(0);

  const calendarsRef = useRef<CalendarItem[]>([]);
  const eventsRef = useRef<CalendarEvent[]>([]);

  // Load calendars once
  useEffect(() => {
    async function load() {
      try {
        const cals = await getCalendars(userId);
        setCalendars(cals);
        calendarsRef.current = cals;
        if (cals.length > 0) setSelectedCalendarId(cals[0].id);
      } catch {
        showToast("Lỗi tải lịch", "error");
      }
    }
    load();
  }, [userId]);

  // Load events when view/date/refreshKey changes. Dev strict-mode double-fire được
  // xử lý bằng `cancelled` flag + cleanup — không cần loadCountRef guard (bug cumulative).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const visibleCals = calendarsRef.current.filter((c) => c.isVisible).map((c) => c.id);

      // Build window theo UTC-midnight (khớp cách server coi "ngày" trong schedule-expand).
      // Ngày của currentDate lấy theo timezone Asia/Ho_Chi_Minh rồi chuyển về UTC-midnight đúng ngày đó.
      const currentDateStr = toZonedTime(currentDate, "Asia/Ho_Chi_Minh").toISOString().slice(0, 10);
      const utcMidnight = (ds: string) => new Date(`${ds}T00:00:00.000Z`);

      let from: Date;
      let to: Date;
      switch (currentView) {
        case "day":
          from = utcMidnight(currentDateStr);
          to = addDays(from, 1);
          break;
        case "week":
          from = utcMidnight(startOfWeek(new Date(`${currentDateStr}T00:00:00.000Z`), { weekStartsOn: 1 }).toISOString().slice(0, 10));
          to = utcMidnight(endOfWeek(new Date(`${currentDateStr}T00:00:00.000Z`), { weekStartsOn: 1 }).toISOString().slice(0, 10));
          break;
        case "month":
          from = utcMidnight(startOfWeek(startOfMonth(new Date(`${currentDateStr}T00:00:00.000Z`)), { weekStartsOn: 1 }).toISOString().slice(0, 10));
          to = utcMidnight(endOfWeek(endOfMonth(new Date(`${currentDateStr}T00:00:00.000Z`)), { weekStartsOn: 1 }).toISOString().slice(0, 10));
          break;
        case "agenda":
          from = utcMidnight(currentDateStr);
          to = addDays(from, 90);
          break;
      }

      try {
        let allEvents: CalendarEvent[] = [];

        if (visibleCals.length > 0) {
          const rawEvents = await getEvents({ calendarIds: visibleCals, from: from!, to: to! });
          allEvents = rawEvents.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
        }

        const schedules = await getSchedulesForCalendar(
          userId, role, teacherProfileId ?? null, studentClassIds, from!, to!
        );
        allEvents = [...allEvents, ...schedules.map((s) => ({ ...s, start: new Date(s.start), end: new Date(s.end) }))];

        if (!cancelled) setEvents(allEvents);
      } catch {
        if (!cancelled) showToast("Lỗi tải sự kiện", "error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [
    currentView,
    currentDate.toISOString().slice(0, 10),
    userId, role, teacherProfileId, studentClassIds.join(","),
    refreshKey,
  ]);

  const handleSaveEvent = async (data: EventFormData) => {
    try {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      const calId = selectedCalendarId ?? calendars[0]?.id;
      if (!calId) {
        showToast("Vui lòng tạo lịch trước", "warning");
        return;
      }

      let recurrenceRule: string | undefined;
      if (data.recurrenceType !== "NONE") {
        recurrenceRule = createRecurrenceRule({ frequency: data.recurrenceType as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" });
      }

      if (editingEvent) {
        await updateEvent(
          editingEvent.id,
          { title: data.title, description: data.description || undefined, location: data.location || undefined, startTime: start, endTime: end, isAllDay: data.isAllDay, color: data.color, recurrenceRule: recurrenceRule ?? undefined },
          editingEvent.isRecurrenceInstance ? "this" : "all"
        );
        showToast("Đã cập nhật sự kiện", "success");
      } else {
        await createEvent({
          title: data.title, description: data.description || undefined, location: data.location || undefined,
          startTime: start, endTime: end, isAllDay: data.isAllDay, color: data.color, recurrenceRule,
          calendarId: calId, ownerId: userId,
          reminders: data.reminderMinutes.map((m) => ({ method: m === 0 ? "POPUP" : "NOTIFICATION", minutesBefore: m })),
        });
        showToast("Đã tạo sự kiện mới", "success");
      }

      setModalOpen(false);
      setEditingEvent(null);
      setInitialStart(undefined);
      setInitialEnd(undefined);
      // Trigger reload events
      setRefreshKey((k) => k + 1);
    } catch {
      showToast("Lỗi lưu sự kiện", "error");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Bạn có chắc muốn xóa sự kiện này?")) return;
    try {
      await deleteEvent(eventId, "all");
      showToast("Đã xóa sự kiện", "success");
      setModalOpen(false);
      setEditingEvent(null);
      setCalendars((prev) => [...prev]); // trigger re-fetch
    } catch {
      showToast("Lỗi xóa sự kiện", "error");
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.isSchedule) {
      setSelectedSchedule(event);
      setSessionDetailOpen(true);
      return;
    }
    setEditingEvent(event);
    setInitialStart(undefined);
    setInitialEnd(undefined);
    setModalOpen(true);
  };

  const handleEventDragEnd = async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    if (event.isSchedule) {
      showToast("Không thể di chuyển lịch học. Vào phần đăng ký lịch để chỉnh sửa.", "warning");
      return;
    }
    try {
      await updateEvent(event.id, { startTime: newStart, endTime: newEnd }, event.isRecurrenceInstance ? "this" : "all");
      setRefreshKey((k) => k + 1);
    } catch {
      showToast("Lỗi di chuyển sự kiện", "error");
    }
  };

  const handleEditSchedule = () => {
    if (!selectedSchedule?.scheduleMeta) return;
    const meta = selectedSchedule.scheduleMeta;

    // Resolve IDs from reference data by name
    const foundClass = classes.find((c) => c.name === meta.className);
    const foundSubject = subjects.find((s) => s.name === meta.subjectName);
    const foundTeacher = teachers.find((t) => t.user.name === meta.teacherName);
    const foundRoom = rooms.find((r) => r.name === meta.room);
    const isWeekly = selectedSchedule.recurrenceRule != null;

    setEditScheduleData({
      seriesId: meta.scheduleId,
      instanceDate: meta.instanceDate,
      classId: foundClass?.id || "",
      subjectId: foundSubject?.id || "",
      teacherId: foundTeacher?.id || "",
      dayOfWeek: meta.dayOfWeek,
      startTime: meta.startTime,
      endTime: meta.endTime,
      room: foundRoom?.name || meta.room || "",
      startDate: meta.instanceDate,
      endDate: meta.seriesEndDate ?? null,
      recurrence: isWeekly ? "WEEKLY" : "NONE",
    } as never);
    setSessionDetailOpen(false);
    setScheduleModalOpen(true);
  };

  const handleCalendarToggle = (calId: string) => {
    setCalendars((prev) => prev.map((c) => (c.id === calId ? { ...c, isVisible: !c.isVisible } : c)));
  };

  const handleCreateCalendar = async (name: string, color: string) => {
    try {
      await createCalendar({ name, color }, userId);
      showToast("Đã tạo lịch mới", "success");
      const cals = await getCalendars(userId);
      setCalendars(cals);
      calendarsRef.current = cals;
    } catch {
      showToast("Lỗi tạo lịch", "error");
    }
  };

  const handleDeleteCalendar = async (calId: string) => {
    try {
      await deleteCalendar(calId);
      showToast("Đã xóa lịch", "success");
      if (selectedCalendarId === calId) setSelectedCalendarId(undefined);
      const cals = await getCalendars(userId);
      setCalendars(cals);
      calendarsRef.current = cals;
    } catch {
      showToast("Lỗi xóa lịch", "error");
    }
  };

  const renderView = () => {
    switch (currentView) {
      case "day":
        return <DayView date={currentDate} events={events} onEventClick={handleEventClick} onEventDragEnd={handleEventDragEnd} />;
      case "week":
        return <WeekView date={currentDate} events={events} onEventClick={handleEventClick} onEventDragEnd={handleEventDragEnd} />;
      case "month":
        return <MonthView date={currentDate} events={events} onEventClick={handleEventClick} onDateClick={(d) => { setCurrentDate(d); setCurrentView("day"); }} />;
      case "agenda":
        return <AgendaView startDate={currentDate} days={90} events={events} onEventClick={handleEventClick} />;
    }
  };

  return (
    <div className="flex h-full relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 transition-transform`}>
        <CalendarSidebar
          calendars={calendars}
          selectedDate={currentDate}
          onDateSelect={(d) => { setCurrentDate(d); setCurrentView("day"); setSidebarOpen(false); }}
          onCalendarToggle={handleCalendarToggle}
          onCreateCalendar={handleCreateCalendar}
          onDeleteCalendar={handleDeleteCalendar}
          onCalendarSelect={setSelectedCalendarId}
          selectedCalendarId={selectedCalendarId}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <CalendarHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentView={currentView}
          currentDate={currentDate}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
          onToday={() => setCurrentDate(new Date())}
          onCreateSchedule={() => setScheduleModalOpen(true)}
          role={role}
        />
        <div className="flex-1 overflow-hidden">{renderView()}</div>
      </div>
      <EventModal
        isOpen={modalOpen}
        event={editingEvent}
        initialStart={initialStart}
        initialEnd={initialEnd}
        onClose={() => { setModalOpen(false); setEditingEvent(null); setInitialStart(undefined); setInitialEnd(undefined); }}
        onSave={handleSaveEvent}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
      />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => { setScheduleModalOpen(false); setEditScheduleData(null); }}
        onSuccess={() => { setRefreshKey((k) => k + 1); }}
        role={role}
        currentTeacherProfileId={teacherProfileId}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        editSchedule={editScheduleData as never}
      />

      <SessionDetailModal
        isOpen={sessionDetailOpen}
        onClose={() => { setSessionDetailOpen(false); setSelectedSchedule(null); }}
        schedule={selectedSchedule as never}
        role={role}
        onUpdate={() => { setRefreshKey((k) => k + 1); }}
        onEditSchedule={handleEditSchedule}
      />
    </div>
  );
}
