import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { teacherClassIds } from "@/lib/teacher-classes";

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
      // Lớp phụ trách: chủ nhiệm HOẶC có dạy (scheduleSeries)
      const ids = await teacherClassIds(session.userId);
      classes = await db.class.findMany({
        where: { id: { in: ids } },
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
