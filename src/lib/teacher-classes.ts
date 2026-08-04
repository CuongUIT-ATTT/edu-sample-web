import { db } from "@/lib/db";

/**
 * Kiểm tra giảng viên có được phép thao tác trên một lớp hay không.
 * Định nghĩa "lớp phụ trách": chủ nhiệm (formTeacherId) HOẶC có dạy (có scheduleSeries).
 */
export async function teacherOwnsClass(userId: string, classId: string): Promise<boolean> {
  const teacher = await db.teacherProfile.findUnique({ where: { userId } });
  if (!teacher) return false;
  const cls = await db.class.findFirst({
    where: {
      id: classId,
      OR: [
        { formTeacherId: teacher.id },
        { scheduleSeries: { some: { teacherId: teacher.id } } },
      ],
    },
  });
  return !!cls;
}

/**
 * Trả danh sách ID lớp mà giảng viên phụ trách (chủ nhiệm HOẶC có dạy qua scheduleSeries).
 * Dùng chung cho mọi trang/action của GV — nguồn chân lý duy nhất cho "lớp phụ trách".
 */
export async function teacherClassIds(userId: string): Promise<string[]> {
  const teacher = await db.teacherProfile.findUnique({ where: { userId } });
  if (!teacher) return [];
  const classes = await db.class.findMany({
    where: {
      OR: [
        { formTeacherId: teacher.id },
        { scheduleSeries: { some: { teacherId: teacher.id } } },
      ],
    },
    select: { id: true },
  });
  return classes.map((c) => c.id);
}
