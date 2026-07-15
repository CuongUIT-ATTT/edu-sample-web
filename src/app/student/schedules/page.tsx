/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import WeeklyTimetable from "@/components/WeeklyTimetable";

export const dynamic = "force-dynamic";

export default async function StudentSchedulesPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { classes: true },
  });

  if (!studentProfile || studentProfile.classes.length === 0) {
    return (
      <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
        <p className="font-body text-ink-muted-80">Bạn chưa được xếp vào lớp học nào. Vui lòng liên hệ Quản trị viên để được xếp lớp.</p>
      </div>
    );
  }

  const classIds = studentProfile.classes.map((c) => c.id);

  // Fetch student class schedules
  const schedules = await db.schedule.findMany({
    where: { classId: { in: classIds } },
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Thời khóa biểu của tôi</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Học viên: <span className="font-semibold text-ink">{session.name}</span> — Lớp: <span className="font-semibold text-primary">{studentProfile.classes.map((c) => c.name).join(", ")}</span>
        </p>
      </div>

      <WeeklyTimetable
        initialSchedules={schedules as any}
        classes={studentProfile.classes as any}
        subjects={[]}
        teachers={[]}
        rooms={[]}
        userRole="STUDENT"
        currentStudentProfileId={studentProfile.id}
      />
    </div>
  );
}
