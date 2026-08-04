"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AttendanceStatus } from "@prisma/client";
import { teacherClassIds } from "@/lib/teacher-classes";
import { revalidatePath } from "next/cache";

interface MarkAttendanceInput {
  studentId: string;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
}

export async function markAttendance(input: MarkAttendanceInput) {
  try {
    // 1. Get session and authenticate
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    // 2. Authorize: Only TEACHER or ADMIN can mark attendance
    const { role } = session;
    if (role !== "TEACHER" && role !== "ADMIN") {
      return { success: false, error: "Bạn không có quyền hạn thực hiện điểm danh." };
    }

    // 2b. TEACHER: chỉ điểm danh học sinh thuộc lớp mình phụ trách
    if (role === "TEACHER") {
      const ownedClassIds = await teacherClassIds(session.userId);
      const student = await db.studentProfile.findFirst({
        where: { id: input.studentId, classes: { some: { id: { in: ownedClassIds } } } },
      });
      if (!student) {
        return { success: false, error: "Bạn không được điểm danh học sinh lớp không phụ trách." };
      }
    }

    // 3. Database upsert operation via Prisma Client
    const attendanceDate = new Date(input.date);
    attendanceDate.setHours(0, 0, 0, 0); // Normalize date to local midnight

    const attendance = await db.attendance.upsert({
      where: {
        studentId_date: {
          studentId: input.studentId,
          date: attendanceDate,
        },
      },
      update: {
        status: input.status,
        remarks: input.remarks,
      },
      create: {
        studentId: input.studentId,
        date: attendanceDate,
        status: input.status,
        remarks: input.remarks,
      },
    });

    // 4. Trigger Next.js cache revalidation to update UIs
    revalidatePath("/teacher/attendance");
    revalidatePath(`/student/attendance`);
    revalidatePath(`/parent/attendance`);
    revalidatePath(`/admin/attendance`);

    return { success: true, data: attendance };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi ghi điểm danh." };
  }
}
