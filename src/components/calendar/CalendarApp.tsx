"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
import CalendarHeader from "./CalendarHeader";
import CalendarSidebar from "./CalendarSidebar";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import AgendaView from "./AgendaView";
import EventModal, { type EventFormData } from "./EventModal";
import ScheduleModal from "./ScheduleModal";
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

  const calendarsRef = useRef<CalendarItem[]>([]);
  const eventsRef = useRef<CalendarEvent[]>([]);
  const loadCountRef = useRef(0);

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

  // Load events when view/date changes
  useEffect(() => {
    // Guard: prevent double-fire in dev strict mode
    loadCountRef.current++;
    if (loadCountRef.current > 10) return;

    let cancelled = false;

    async function load() {
      const visibleCals = calendarsRef.current.filter((c) => c.isVisible).map((c) => c.id);

      let from: Date;
      let to: Date;
      switch (currentView) {
        case "day":
          from = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          to = addDays(from, 1);
          break;
        case "week":
          from = startOfWeek(currentDate, { weekStartsOn: 1 });
          to = endOfWeek(from, { weekStartsOn: 1 });
          break;
        case "month":
          from = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
          to = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
          break;
        case "agenda":
          from = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentView,
    currentDate.toISOString().slice(0, 10),
    userId, role, teacherProfileId, studentClassIds.join(","),
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
      // Force re-mount by changing a key — just reload by toggling currentView
      setEvents([]);
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
      // Schedule events: show read-only info, don't open edit modal
      showToast(
        `${event.scheduleMeta?.subjectName} — ${event.scheduleMeta?.className}\n` +
        `${event.scheduleMeta?.teacherName} | ${event.scheduleMeta?.room ?? "Chưa có phòng"}\n` +
        `${event.scheduleMeta?.startTime} - ${event.scheduleMeta?.endTime}`,
        "info"
      );
      return;
    }
    setEditingEvent(event);
    setInitialStart(undefined);
    setInitialEnd(undefined);
    setModalOpen(true);
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setInitialStart(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 9, 0));
    setInitialEnd(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0));
    setModalOpen(true);
  };

  const handleEventDragEnd = async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    try {
      await updateEvent(event.id, { startTime: newStart, endTime: newEnd }, event.isRecurrenceInstance ? "this" : "all");
      loadCountRef.current = 0;
      setEvents([]);
    } catch {
      showToast("Lỗi di chuyển sự kiện", "error");
    }
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
    <div className="flex h-full">
      <CalendarSidebar
        calendars={calendars}
        selectedDate={currentDate}
        onDateSelect={(d) => { setCurrentDate(d); setCurrentView("day"); }}
        onCalendarToggle={handleCalendarToggle}
        onCreateCalendar={handleCreateCalendar}
        onDeleteCalendar={handleDeleteCalendar}
        onCalendarSelect={setSelectedCalendarId}
        selectedCalendarId={selectedCalendarId}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <CalendarHeader
          currentView={currentView}
          currentDate={currentDate}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
          onToday={() => setCurrentDate(new Date())}
          onCreateEvent={handleCreateEvent}
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
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={() => { loadCountRef.current = 0; setEvents([]); }}
        role={role}
        currentTeacherProfileId={teacherProfileId}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
      />
    </div>
  );
}
