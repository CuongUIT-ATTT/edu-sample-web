import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let classes;
    if (session.role === "ADMIN") {
      classes = await db.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    } else {
      // Find teacher profile
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.userId },
      });

      if (!teacherProfile) {
        return NextResponse.json({ classes: [] });
      }

      // For simplicity, return classes that have schedules taught by this teacher
      // or classes they form-manage.
      classes = await db.class.findMany({
        where: {
          OR: [
            { formTeacherId: teacherProfile.id },
            { schedules: { some: { teacherId: teacherProfile.id } } }
          ]
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
