import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const from = parseInt(req.nextUrl.searchParams.get("from") || req.nextUrl.searchParams.get("month") || "0");
  const to = parseInt(req.nextUrl.searchParams.get("to") || req.nextUrl.searchParams.get("month") || "0");
  const year = parseInt(req.nextUrl.searchParams.get("year") || "0");

  if (!studentId || !from || !year) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const startDate = new Date(year, from - 1, 1);
  const endDate = new Date(year, to, 0, 23, 59, 59);

  const records = await db.attendance.findMany({
    where: { studentId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ records });
}