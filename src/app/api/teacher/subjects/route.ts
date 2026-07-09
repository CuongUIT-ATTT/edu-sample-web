import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let subjects;
    if (session.role === "ADMIN") {
      subjects = await db.subject.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      });
    } else {
      // Find teacher profile
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.userId },
        include: {
          subjects: {
            select: { id: true, name: true, code: true },
            orderBy: { name: "asc" },
          },
        },
      });

      subjects = teacherProfile?.subjects || [];
    }

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
