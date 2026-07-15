import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const type = searchParams.get("type");

    if (!classId || !subjectId || !type) {
      return NextResponse.json({ error: "Missing query parameters" }, { status: 400 });
    }

    // Fetch existing grades for students in this class, for this subject and type
    const grades = await db.grade.findMany({
      where: {
        subjectId,
        type: type.toUpperCase(),
        student: {
          classes: {
            some: { id: classId }
          }
        },
      },
      select: {
        studentId: true,
        score: true,
        weight: true,
        remarks: true,
      },
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error("Error fetching class grades:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
