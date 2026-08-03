import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * GET /api/admin/classes/[classId]/schedules
 * Trả về toàn bộ ca học của một lớp (không giới hạn cửa sổ) — dùng cho dropdown
 * "Chọn buổi học" ở trang điểm danh admin. Sắp theo ngày thật, row legacy (không date) cuối.
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

    const schedules = await db.schedule.findMany({
      where: { classId },
      include: {
        class: true,
        subject: true,
      },
      orderBy: [
        { date: { sort: "asc", nulls: "last" } },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching class schedules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
