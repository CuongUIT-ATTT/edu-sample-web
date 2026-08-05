import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { teacherClassIds as getTeacherClassIds } from "@/lib/teacher-classes";
import CalendarApp from "@/components/calendar/CalendarApp";

export default async function TeacherCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  // Giáo viên chỉ đăng ký lịch cho lớp mình phụ trách: chủ nhiệm HOẶC có dạy (scheduleSeries)
  const teacherClassIds = teacherProfile ? await getTeacherClassIds(session.userId) : [];

  const [classes, subjects, rooms] = await Promise.all([
    teacherClassIds.length > 0
      ? db.class.findMany({ where: { id: { in: teacherClassIds } }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    // GV chỉ thấy môn mình được gán dạy (TeacherProfile.subjects), không thấy môn lớp khác
    teacherProfile
      ? db.subject.findMany({
          where: { teachers: { some: { id: teacherProfile.id } } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    db.room.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="h-full p-4 md:p-8">
      <CalendarApp
        userId={session.userId}
        userName={session.name}
        role={session.role}
        teacherProfileId={teacherProfile?.id ?? null}
        classes={classes}
        subjects={subjects}
        rooms={rooms}
      />
    </div>
  );
}
