import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherProfile = await db.teacherProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const schedules = await db.schedule.findMany({
      where: { teacherId: teacherProfile.id },
      include: {
        class: true,
        subject: true,
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching teacher schedules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
