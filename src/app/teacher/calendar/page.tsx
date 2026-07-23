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

  const [classes, subjects, rooms] = await Promise.all([
    db.class.findMany({ orderBy: { name: "asc" } }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.room.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="h-[calc(100vh-60px)]">
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
