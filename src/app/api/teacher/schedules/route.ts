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

    // Chỉ hiện các ca học trong cửa sổ [-21 ngày, +7 ngày] so với hôm nay (local).
    // Dựng biên qua UTC-midnight của ngày lịch local để khớp chính xác cách createSchedule
    // lưu Schedule.date = new Date("YYYY-MM-DD") (parse thành UTC midnight) — tránh lệch +7h.
    const dateOnly = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const today = new Date();
    const windowStart = new Date(dateOnly(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 21)));
    const windowEnd = new Date(dateOnly(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)));

    const schedules = await db.schedule.findMany({
      where: {
        teacherId: teacherProfile.id,
        date: { gte: windowStart, lte: windowEnd },
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching teacher schedules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
