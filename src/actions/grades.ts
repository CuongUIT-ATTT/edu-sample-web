"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface SubmitGradeInput {
  studentId: string;
  subjectId: string;
  type: string; // e.g. "QUIZ", "MIDTERM", "FINAL"
  score: number;
  weight: number;
  remarks?: string;
}

export async function submitGrade(input: SubmitGradeInput) {
  try {
    // 1. Get session and authenticate
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    // 2. Authorize: Only TEACHER or ADMIN can record grades
    const { role, userId } = session;
    if (role !== "TEACHER" && role !== "ADMIN") {
      return { success: false, error: "Bạn không có quyền hạn ghi nhận điểm số." };
    }

    // 3. If teacher, verify the teacher profile exists
    let teacherId = "";
    if (role === "TEACHER") {
      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId },
      });
      if (!teacherProfile) {
        return { success: false, error: "Không tìm thấy hồ sơ giáo viên tương ứng." };
      }
      teacherId = teacherProfile.id;
    } else {
      // For Admin, pick the first teacher or a system/fallback teacher since admin is executing
      const firstTeacher = await db.teacherProfile.findFirst();
      if (!firstTeacher) {
        return { success: false, error: "Hệ thống chưa cấu hình giáo viên nào." };
      }
      teacherId = firstTeacher.id;
    }

    // 4. Validate input data
    if (input.score < 0 || input.score > 10) {
      return { success: false, error: "Điểm số phải nằm trong khoảng từ 0 đến 10." };
    }
    if (input.weight <= 0 || input.weight > 1) {
      return { success: false, error: "Trọng số điểm phải lớn hơn 0 và nhỏ hơn hoặc bằng 1." };
    }

    // 5. Database write operation via Prisma Client
    const grade = await db.grade.create({
      data: {
        studentId: input.studentId,
        subjectId: input.subjectId,
        teacherId: teacherId,
        type: input.type.toUpperCase(),
        score: input.score,
        weight: input.weight,
        remarks: input.remarks,
      },
    });

    // 6. Trigger Next.js cache revalidation to update UIs
    revalidatePath("/teacher/grades");
    revalidatePath(`/student/grades`);
    revalidatePath(`/parent/grades`);

    return { success: true, data: grade };
  } catch (error) {
    console.error("Error submitting grade:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi ghi nhận điểm số." };
  }
}
