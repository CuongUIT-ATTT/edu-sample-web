import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

    const students = await db.studentProfile.findMany({
      where: { classId },
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
