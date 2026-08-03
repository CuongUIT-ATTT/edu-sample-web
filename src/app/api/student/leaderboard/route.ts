import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    if (!classId || !subjectId) {
      return NextResponse.json({ error: "classId và subjectId là bắt buộc" }, { status: 400 });
    }

    // Chỉ học viên mới xem được bảng xếp hạng, và chỉ cho lớp mình đang học
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
      include: { classes: true },
    });
    if (!studentProfile || !studentProfile.classes.some((c) => c.id === classId)) {
      return NextResponse.json({ error: "Bạn không có quyền xem bảng xếp hạng lớp này" }, { status: 403 });
    }

    // Get all students in the class
    const students = await db.studentProfile.findMany({
      where: {
        classes: { some: { id: classId } },
      },
      include: {
        user: { select: { name: true } },
        grades: {
          where: { subjectId },
          select: { score: true, type: true, date: true },
        },
      },
    });

    const ranked = students
      .map((s) => {
        const gradeList = s.grades;
        const avgScore =
          gradeList.length > 0
            ? Math.round(
                (gradeList.reduce((acc, g) => acc + g.score, 0) / gradeList.length) * 10
              ) / 10
            : null;

        let badge = "Đang luyện tập";
        if (avgScore !== null) {
          if (avgScore >= 9.0) badge = "Huyền Thoại 🏆";
          else if (avgScore >= 8.0) badge = "Xuất Sắc ⚡";
          else if (avgScore >= 6.5) badge = "Tiến Bộ 🔥";
          else badge = "Cố lên! 💪";
        }

        return {
          id: s.id,
          name: s.user.name,
          avgScore,
          gradesCount: gradeList.length,
          badge,
        };
      })
      .sort((a, b) => {
        if (a.avgScore === null && b.avgScore === null) return 0;
        if (a.avgScore === null) return 1;
        if (b.avgScore === null) return -1;
        return b.avgScore - a.avgScore;
      });

    return NextResponse.json({ data: ranked });
  } catch (err) {
    console.error("Leaderboard API error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
