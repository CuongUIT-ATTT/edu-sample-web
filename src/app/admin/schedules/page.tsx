/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import WeeklyTimetable from "@/components/WeeklyTimetable";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  const schedules = await db.schedule.findMany({
    include: {
      class: true,
      subject: true,
      homeworkQuiz: {
        select: { id: true, title: true }
      },
      teacher: {
        include: { user: true },
      },
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });

  const classes = await db.class.findMany({ orderBy: { name: "asc" } });
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" } });
  const teachers = await db.teacherProfile.findMany({
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });
  
  // Fetch rooms list
  const rooms = await db.room.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý thời khoá biểu</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Sắp xếp lịch học tuần, kiểm tra xung đột trùng lịch giữa các lớp có chung học viên.
        </p>
      </div>

      <WeeklyTimetable
        initialSchedules={schedules as any}
        classes={classes}
        subjects={subjects}
        teachers={teachers as any}
        rooms={rooms}
      />
    </div>
  );
}
