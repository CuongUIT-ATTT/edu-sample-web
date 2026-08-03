import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import CalendarApp from "@/components/calendar/CalendarApp";

export default async function TeacherCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacherProfile = await db.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  // Giáo viên chỉ đăng ký lịch cho lớp mình phụ trách: chủ nhiệm HOẶC có dạy
  const teacherClassIds = teacherProfile
    ? (
        await db.class.findMany({
          where: {
            OR: [
              { formTeacherId: teacherProfile.id },
              { schedules: { some: { teacherId: teacherProfile.id } } },
            ],
          },
          select: { id: true },
        })
      ).map((c) => c.id)
    : [];

  const [classes, subjects, rooms] = await Promise.all([
    teacherClassIds.length > 0
      ? db.class.findMany({ where: { id: { in: teacherClassIds } }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    db.subject.findMany({ orderBy: { name: "asc" } }),
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
