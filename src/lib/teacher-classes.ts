import { db } from "@/lib/db";

/**
 * Kiểm tra giảng viên có được phép thao tác trên một lớp hay không.
 * Định nghĩa "lớp phụ trách": chủ nhiệm (formTeacherId) HOẶC có dạy (có schedule).
 */
export async function teacherOwnsClass(userId: string, classId: string): Promise<boolean> {
  const teacher = await db.teacherProfile.findUnique({ where: { userId } });
  if (!teacher) return false;
  const cls = await db.class.findFirst({
    where: {
      id: classId,
      OR: [
        { formTeacherId: teacher.id },
        { schedules: { some: { teacherId: teacher.id } } },
      ],
    },
  });
  return !!cls;
}
