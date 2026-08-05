"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { teacherOwnsClass } from "@/lib/teacher-classes";

export async function updateClass(classId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    // TEACHER: chỉ sửa lớp mình phụ trách
    if (session.role === "TEACHER" && !(await teacherOwnsClass(session.userId, classId))) {
      return { success: false, error: "Bạn không được chỉnh sửa lớp không phụ trách." };
    }

    const name = formData.get("name") as string;
    const gradeLevelStr = formData.get("gradeLevel") as string;
    const formTeacherId = formData.get("formTeacherId") as string;

    const gradeLevel = parseInt(gradeLevelStr);

    if (!name || isNaN(gradeLevel)) {
      return { success: false, error: "Vui lòng điền đầy đủ tên lớp và khối học." };
    }

    // Check unique class name
    const existing = await db.class.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: classId },
      },
    });

    if (existing) {
      return { success: false, error: "Tên lớp này đã tồn tại." };
    }

    await db.class.update({
      where: { id: classId },
      data: {
        name: name.trim(),
        gradeLevel,
        formTeacherId: formTeacherId || null,
      },
    });

    revalidatePath("/admin/classes");
    revalidatePath("/teacher");
    return { success: true, message: "Cập nhật lớp luyện thi thành công." };
  } catch (error) {
    console.error("Error updating class:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi chỉnh sửa lớp." };
  }
}

export async function deleteClass(classId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    // TEACHER: chỉ xóa lớp mình phụ trách
    if (session.role === "TEACHER" && !(await teacherOwnsClass(session.userId, classId))) {
      return { success: false, error: "Bạn không được xoá lớp không phụ trách." };
    }

    await db.class.delete({
      where: { id: classId },
    });

    revalidatePath("/admin/classes");
    revalidatePath("/teacher");
    return { success: true, message: "Xoá lớp luyện thi thành công." };
  } catch (error) {
    console.error("Error deleting class:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá lớp học." };
  }
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    // TEACHER: chỉ thao tác lớp mình phụ trách
    if (session.role === "TEACHER" && !(await teacherOwnsClass(session.userId, classId))) {
      return { success: false, error: "Bạn không được thao tác trên lớp không phụ trách." };
    }

    await db.class.update({
      where: { id: classId },
      data: {
        students: {
          disconnect: { id: studentId }
        }
      }
    });

    revalidatePath("/admin/classes");
    revalidatePath("/teacher");
    return { success: true, message: "Loại học viên khỏi lớp thành công." };
  } catch (error) {
    console.error("Error removing student from class:", error);
    return { success: false, error: "Đã xảy ra lỗi khi loại học viên khỏi lớp." };
  }
}

export async function addStudentToClass(classId: string, studentId: string | string[]) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TEACHER")) {
      return { success: false, error: "Bạn không có quyền thực hiện thao tác này." };
    }

    // TEACHER: chỉ thao tác lớp mình phụ trách
    if (session.role === "TEACHER" && !(await teacherOwnsClass(session.userId, classId))) {
      return { success: false, error: "Bạn không được thao tác trên lớp không phụ trách." };
    }

    const studentIds = Array.isArray(studentId) ? studentId : [studentId];

    await db.class.update({
      where: { id: classId },
      data: {
        students: {
          connect: studentIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/admin/classes");
    revalidatePath("/teacher");
    return { success: true, message: "Thêm học viên vào lớp thành công." };
  } catch (error) {
    console.error("Error adding student to class:", error);
    return { success: false, error: "Đã xảy ra lỗi khi xếp học viên vào lớp." };
  }
}
