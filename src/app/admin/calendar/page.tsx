import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import CalendarApp from "@/components/calendar/CalendarApp";

export default async function AdminCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [classes, subjects, teacherProfiles, rooms] = await Promise.all([
    db.class.findMany({ orderBy: { name: "asc" } }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.teacherProfile.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
    db.room.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="h-full p-4 md:p-8">
      <CalendarApp
        userId={session.userId}
        userName={session.name}
        role={session.role}
        classes={classes}
        subjects={subjects}
        teachers={teacherProfiles.map((tp) => ({ id: tp.id, user: tp.user }))}
        rooms={rooms}
      />
    </div>
  );
}
