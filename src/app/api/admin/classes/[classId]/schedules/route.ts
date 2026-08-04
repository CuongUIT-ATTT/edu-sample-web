import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expandSeriesToInstances, dateToUtcStr } from "@/lib/schedule-expand";

/**
 * GET /api/admin/classes/[classId]/schedules
 * Trả về toàn bộ buổi học của một lớp (không giới hạn cửa sổ) — dùng cho dropdown
 * "Chọn buổi học" ở trang điểm danh admin. Expand runtime từ ScheduleSeries,
 * sắp theo ngày thật tăng dần.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId } = await params;

    const series = await db.scheduleSeries.findMany({
      where: { classId },
      include: {
        class: true,
        subject: true,
        exceptions: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startDate: "asc" }],
    });

    // Expand từ startDate tới min(endDate, ±1 năm quanh hôm nay) — không quét vô hạn.
    const today = new Date();
    const nowUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const oneYearAgo = new Date(nowUtc);
    oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 365);
    const oneYearLater = new Date(nowUtc);
    oneYearLater.setUTCDate(oneYearLater.getUTCDate() + 365);

    const schedules = series.flatMap((s) =>
      expandSeriesToInstances(s, s.exceptions, oneYearAgo, oneYearLater).map((inst) => ({
        id: `${s.id}-${dateToUtcStr(inst.instanceDate)}`,
        seriesId: s.id,
        instanceDate: dateToUtcStr(inst.instanceDate),
        date: inst.instanceDate,
        dayOfWeek: s.dayOfWeek,
        startTime: inst.startTime,
        endTime: inst.endTime,
        room: inst.room,
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
    console.error("Error fetching class schedules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
