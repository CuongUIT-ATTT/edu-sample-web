import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import CalendarApp from "@/components/calendar/CalendarApp";

export default async function StudentCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { classes: true },
  });

  const studentClassIds = studentProfile?.classes.map((c) => c.id) ?? [];

  return (
    <div className="h-[calc(100vh-60px)]">
      <CalendarApp
        userId={session.userId}
        userName={session.name}
        role={session.role}
        studentClassIds={studentClassIds}
      />
    </div>
  );
}
