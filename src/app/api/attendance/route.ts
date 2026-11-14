import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { teacherClassIds } from "@/lib/teacher-classes";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const studentId = req.nextUrl.searchParams.get("studentId");
  const from = parseInt(req.nextUrl.searchParams.get("from") || req.nextUrl.searchParams.get("month") || "0");
  const to = parseInt(req.nextUrl.searchParams.get("to") || req.nextUrl.searchParams.get("month") || "0");
  const year = parseInt(req.nextUrl.searchParams.get("year") || "0");

  if (!studentId || !Number.isInteger(from) || from < 1 || from > 12 || !Number.isInteger(to) || to < from || to > 12 || !Number.isInteger(year) || year < 1900 || year > 9999) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  let scope: Prisma.StudentProfileWhereInput;
  switch (session.role) {
    case "ADMIN": scope = {}; break;
    case "STUDENT": scope = { userId: session.userId }; break;
    case "PARENT": scope = { parent: { userId: session.userId } }; break;
    case "TEACHER": scope = { classes: { some: { id: { in: await teacherClassIds(session.userId) } } } }; break;
    default: return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const student = await db.studentProfile.findFirst({ where: { AND: [{ id: studentId }, scope] }, select: { id: true } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const startDate = new Date(year, from - 1, 1);
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const monthEnd = new Date(year, to, 0, 23, 59, 59);
  const endDate = monthEnd > todayEnd ? todayEnd : monthEnd;

  const records = await db.attendance.findMany({
    where: { studentId, student: scope, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ records });
}