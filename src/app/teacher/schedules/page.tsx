/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import WeeklyTimetable from "@/components/WeeklyTimetable";

export const dynamic = "force-dynamic";

export default async function TeacherSchedulesPage() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    redirect("/login");
  }

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!teacherProfile) {
    redirect("/login");
  }

  // Fetch ALL schedules to check overlaps and display "Đã bận" slots
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
  const rooms = await db.room.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý lịch học lớp</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Tự sắp xếp lịch dạy của bạn. Các ca của lớp khác sẽ hiển thị là &quot;Đã bận&quot; để đảm bảo tính riêng tư.
        </p>
      </div>

      <WeeklyTimetable
        initialSchedules={schedules as any}
        classes={classes}
        subjects={subjects}
        teachers={[]} // Not needed when isTeacherRole is true
        rooms={rooms}
        isTeacherRole={true}
        currentTeacherProfileId={teacherProfile.id}
        userRole="TEACHER"
      />
    </div>
  );
}
