import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CalendarApp from "@/components/calendar/CalendarApp";

export default async function StudentCalendarPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");
  const user = session;

  return (
    <div className="h-[calc(100vh-60px)]">
      <CalendarApp userId={user.userId} userName={user.name} />
    </div>
  );
}
