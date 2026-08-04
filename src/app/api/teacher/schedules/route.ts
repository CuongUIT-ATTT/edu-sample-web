import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expandSeriesToInstances, normalizeDateUtc, dateToUtcStr } from "@/lib/schedule-expand";

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

    // Cửa sổ [-21 ngày, +7 ngày] so với hôm nay. Dùng normalizeDateUtc để khớp quy ước
    // lưu date (UTC midnight) — tránh lệch +7h.
    const today = new Date();
    const todayUtc = normalizeDateUtc(today);
    const windowStart = new Date(todayUtc);
    windowStart.setUTCDate(windowStart.getUTCDate() - 21);
    const windowEnd = new Date(todayUtc);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 7);

    const series = await db.scheduleSeries.findMany({
      where: { teacherId: teacherProfile.id },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
        exceptions: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startDate: "asc" }],
    });

    // Expand runtime → trả các occurrence thật trong window
    const schedules = series.flatMap((s) =>
      expandSeriesToInstances(s, s.exceptions, windowStart, windowEnd).map((inst) => ({
        id: s.id,
        classId: inst.classId,
        subjectId: inst.subjectId,
        teacherId: inst.teacherId,
        dayOfWeek: s.dayOfWeek,
        startTime: inst.startTime,
        endTime: inst.endTime,
        room: inst.room,
        date: inst.instanceDate,
        instanceDate: dateToUtcStr(inst.instanceDate),
        class: s.class,
        subject: s.subject,
      }))
    );

    schedules.sort((a, b) => {
      const da = a.date.getTime();
      const dbT = b.date.getTime();
      if (da !== dbT) return da - dbT;
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching teacher schedules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
