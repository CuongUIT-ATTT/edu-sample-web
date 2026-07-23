"use server";

import { db } from "@/lib/db";
import { expandRecurrence, generateRecurrenceId } from "@/lib/recurrence";
import type { RecurrenceException } from "@/lib/recurrence";
import type { EventStatus } from "@prisma/client";

// ─── Calendar CRUD ─────────────────────────────────────────────────

export async function getCalendars(userId: string) {
  return db.calendar.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { events: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createCalendar(
  data: { name: string; color?: string; timezoneDefault?: string },
  userId: string
) {
  return db.calendar.create({
    data: {
      name: data.name,
      color: data.color ?? "#4285F4",
      timezoneDefault: data.timezoneDefault ?? "Asia/Ho_Chi_Minh",
      ownerId: userId,
    },
  });
}

export async function updateCalendar(
  id: string,
  data: { name?: string; color?: string; isVisible?: boolean }
) {
  return db.calendar.update({ where: { id }, data });
}

export async function deleteCalendar(id: string) {
  return db.calendar.delete({ where: { id } });
}

// ─── Event CRUD ────────────────────────────────────────────────────

export interface GetEventsParams {
  calendarIds: string[];
  from: Date;
  to: Date;
}

export async function getEvents(params: GetEventsParams) {
  const { calendarIds, from, to } = params;

  const events = await db.event.findMany({
    where: {
      calendarId: { in: calendarIds },
      status: { not: "CANCELLED" },
    },
    include: {
      reminders: true,
      participants: { include: { user: true } },
      exceptions: true,
    },
    orderBy: { startTime: "asc" },
  });

  type ExpandedEvent = {
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
    reminders: Array<{ id: string; method: string; minutesBefore: number }>;
    participants: Array<{
      id: string;
      userId: string;
      responseStatus: string;
      role: string;
      user: { id: string; name: string; email: string };
    }>;
  };

  const expandedEvents: ExpandedEvent[] = [];

  for (const event of events) {
    const exceptions: RecurrenceException[] = event.exceptions.map((ex) => ({
      originalStart: ex.originalStart,
      recurrenceId: ex.recurrenceId,
      startTime: ex.startTime ?? undefined,
      endTime: ex.endTime ?? undefined,
      title: ex.title ?? undefined,
      description: ex.description ?? undefined,
      location: ex.location ?? undefined,
      isAllDay: ex.isAllDay ?? undefined,
      status: ex.status ?? undefined,
    }));

    const instances = expandRecurrence(
      {
        startTime: event.startTime,
        endTime: event.endTime,
        recurrenceRule: event.recurrenceRule ?? undefined,
      },
      from,
      to,
      exceptions
    );

    for (const instance of instances) {
      expandedEvents.push({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        start: instance.start,
        end: instance.end,
        isAllDay: event.isAllDay,
        timezone: event.timezone,
        color: event.color,
        status: event.status,
        calendarId: event.calendarId,
        ownerId: event.ownerId,
        recurrenceRule: event.recurrenceRule,
        recurrenceId: instance.recurrenceId,
        isException: instance.isException,
        isRecurrenceInstance: !!event.recurrenceRule,
        originalEventId: event.id,
        reminders: event.reminders.map((r) => ({
          id: r.id,
          method: r.method,
          minutesBefore: r.minutesBefore,
        })),
        participants: event.participants.map((p) => ({
          id: p.id,
          userId: p.userId,
          responseStatus: p.responseStatus,
          role: p.role,
          user: { id: p.user.id, name: p.user.name, email: p.user.email },
        })),
      });
    }
  }

  return expandedEvents;
}

export async function createEvent(data: {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  timezone?: string;
  color?: string;
  recurrenceRule?: string;
  calendarId: string;
  ownerId: string;
  reminders?: Array<{ method: string; minutesBefore: number }>;
  participants?: Array<{ userId: string; role?: string }>;
}) {
  const { reminders, participants, ...eventData } = data;

  return db.event.create({
    data: {
      ...eventData,
      isAllDay: eventData.isAllDay ?? false,
      timezone: eventData.timezone ?? "Asia/Ho_Chi_Minh",
      color: eventData.color ?? "#4285F4",
      status: "CONFIRMED",
      reminders: reminders
        ? {
            create: reminders.map((r) => ({
              method: r.method as "POPUP" | "EMAIL" | "NOTIFICATION",
              minutesBefore: r.minutesBefore,
            })),
          }
        : undefined,
      participants: participants
        ? {
            create: participants.map((p) => ({
              userId: p.userId,
              role: (p.role ?? "ATTENDEE") as "ORGANIZER" | "ATTENDEE",
              responseStatus: "PENDING" as const,
            })),
          }
        : undefined,
    },
    include: { reminders: true, participants: true },
  });
}

export async function updateEvent(
  id: string,
  data: {
    title?: string;
    description?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    isAllDay?: boolean;
    timezone?: string;
    color?: string;
    status?: string;
    recurrenceRule?: string;
  },
  scope: "this" | "this_and_following" | "all" = "all"
) {
  const event = await db.event.findUnique({ where: { id } });
  if (!event) throw new Error("Event not found");

  if (!event.recurrenceRule || scope === "all") {
    return db.event.update({ where: { id }, data: { ...data, status: data.status as EventStatus | undefined } });
  }

  if (scope === "this" && data.startTime) {
    const recId = generateRecurrenceId(data.startTime);
    await db.eventException.upsert({
      where: { eventId_recurrenceId: { eventId: id, recurrenceId: recId } } as never,
      create: {
        eventId: id,
        originalStart: data.startTime,
        recurrenceId: recId,
        startTime: data.startTime,
        endTime: data.endTime,
        title: data.title,
        description: data.description,
        location: data.location,
        isAllDay: data.isAllDay,
        status: data.status as "CONFIRMED" | "TENTATIVE" | "CANCELLED" | undefined,
      },
      update: {
        startTime: data.startTime,
        endTime: data.endTime,
        title: data.title,
        description: data.description,
        location: data.location,
        isAllDay: data.isAllDay,
        status: data.status as "CONFIRMED" | "TENTATIVE" | "CANCELLED" | undefined,
      },
    });
    return event;
  }

  if (scope === "this_and_following" && data.startTime) {
    await db.event.update({
      where: { id },
      data: { recurrenceRule: null },
    });
    return db.event.create({
      data: {
        title: data.title ?? event.title,
        description: data.description ?? event.description,
        location: data.location ?? event.location,
        startTime: data.startTime,
        endTime: data.endTime ?? event.endTime,
        isAllDay: data.isAllDay ?? event.isAllDay,
        timezone: data.timezone ?? event.timezone,
        color: data.color ?? event.color,
        status: (data.status as "CONFIRMED" | "TENTATIVE" | "CANCELLED") ?? event.status,
        recurrenceRule: data.recurrenceRule ?? event.recurrenceRule,
        calendarId: event.calendarId,
        ownerId: event.ownerId,
      },
    });
  }

  return db.event.update({
    where: { id },
    data: { ...data, status: data.status as EventStatus | undefined },
  });
}

export async function deleteEvent(
  id: string,
  scope: "this" | "this_and_following" | "all" = "all"
) {
  const event = await db.event.findUnique({ where: { id } });
  if (!event) throw new Error("Event not found");

  if (!event.recurrenceRule || scope === "all") {
    return db.event.delete({ where: { id } });
  }

  if (scope === "this_and_following") {
    return db.event.update({
      where: { id },
      data: { recurrenceRule: null },
    });
  }

  return db.event.delete({ where: { id } });
}

// ─── Schedule → Calendar Event Conversion ───────────────────────────

export interface ScheduleEventDisplay {
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
  isSchedule: boolean;
  originalEventId: string;
  reminders: Array<{ id: string; method: string; minutesBefore: number }>;
  participants: Array<{
    id: string;
    userId: string;
    responseStatus: string;
    role: string;
    user: { id: string; name: string; email: string };
  }>;
  scheduleMeta?: {
    scheduleId: string;
    className: string;
    subjectName: string;
    teacherName: string;
    room: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    materials: string | null;
    homework: string | null;
    homeworkQuizId: string | null;
    homeworkQuizTitle: string | null;
    homeworkDueDate: Date | null;
  };
}

function timeStringToDate(date: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

function getNextDayOfWeek(fromDate: Date, dayOfWeek: number): Date {
  // dayOfWeek: 1=Mon ... 7=Sun
  const date = new Date(fromDate);
  const currentDay = date.getDay(); // 0=Sun ... 6=Sat
  const currentIso = currentDay === 0 ? 7 : currentDay; // convert to 1=Mon ... 7=Sun
  const diff = dayOfWeek - currentIso;
  if (diff >= 0) {
    date.setDate(date.getDate() + diff);
  } else {
    date.setDate(date.getDate() + diff + 7);
  }
  return date;
}

/**
 * Fetch schedules and convert to CalendarEvent-compatible objects.
 * Admin sees all, Teacher sees all but only editable for own, Student sees class schedules.
 */
export async function getSchedulesForCalendar(
  userId: string,
  role: string,
  teacherProfileId: string | null,
  studentClassIds: string[],
  from: Date,
  to: Date
): Promise<ScheduleEventDisplay[]> {
  let schedules;

  if (role === "STUDENT" && studentClassIds.length > 0) {
    schedules = await db.schedule.findMany({
      where: { classId: { in: studentClassIds } },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
        homeworkQuiz: { select: { id: true, title: true } },
      },
      orderBy: { dayOfWeek: "asc" },
    });
  } else {
    schedules = await db.schedule.findMany({
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
        homeworkQuiz: { select: { id: true, title: true } },
      },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  const events: ScheduleEventDisplay[] = [];

  for (const schedule of schedules) {
    // Find all occurrences of this schedule in the [from, to] range
    const firstOccurrence = getNextDayOfWeek(from, schedule.dayOfWeek);
    const occurrence = new Date(firstOccurrence);

    while (occurrence <= to) {
      const start = timeStringToDate(occurrence, schedule.startTime);
      const end = timeStringToDate(occurrence, schedule.endTime);

      events.push({
        id: `schedule-${schedule.id}-${occurrence.toISOString().slice(0, 10)}`,
        title: schedule.subject.name,
        description: schedule.materials ?? null,
        location: schedule.room ?? null,
        start,
        end,
        isAllDay: false,
        timezone: "Asia/Ho_Chi_Minh",
        color: "#34A853", // Green for schedules
        status: "CONFIRMED",
        calendarId: "schedule",
        ownerId: schedule.teacherId,
        recurrenceRule: null,
        recurrenceId: `schedule-${schedule.id}-${occurrence.toISOString()}`,
        isException: false,
        isRecurrenceInstance: true,
        isSchedule: true,
        originalEventId: schedule.id,
        reminders: [],
        participants: [],
        scheduleMeta: {
          scheduleId: schedule.id,
          className: schedule.class.name,
          subjectName: schedule.subject.name,
          teacherName: schedule.teacher.user.name,
          room: schedule.room,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          materials: schedule.materials,
          homework: schedule.homework,
          homeworkQuizId: schedule.homeworkQuizId,
          homeworkQuizTitle: schedule.homeworkQuiz?.title ?? null,
          homeworkDueDate: schedule.homeworkDueDate ?? null,
        },
      });

      // Move to next week
      occurrence.setDate(occurrence.getDate() + 7);
    }
  }

  return events;
}
