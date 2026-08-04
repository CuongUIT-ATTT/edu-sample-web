import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { teacherOwnsClass } from "@/lib/teacher-classes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: classId } = await params;

    // TEACHER: chỉ xem học sinh lớp mình phụ trách
    if (session.role === "TEACHER" && !(await teacherOwnsClass(session.userId, classId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const students = await db.studentProfile.findMany({
      where: {
        classes: {
          some: { id: classId }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    const formattedStudents = students.map((s) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error("Error fetching class students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
