import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * GET /api/admin/attendance?classId=<id>&date=YYYY-MM-DD
 * Returns attendance records for all students in a class on a given day.
 * Admin can view/mark attendance at any time (no time-window restriction).
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classId = req.nextUrl.searchParams.get("classId");
  const date = req.nextUrl.searchParams.get("date");

  if (!classId || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

  const records = await db.attendance.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      student: { classes: { some: { id: classId } } },
    },
  });

  return NextResponse.json({ records });
}
