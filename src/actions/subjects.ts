"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSubject(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được thêm môn học." };
    }

    const name = formData.get("name") as string;
    const code = formData.get("code") as string;

    if (!name || !code) {
      return { success: false, error: "Vui lòng điền tên môn và mã môn học." };
    }

    // Check if unique code or name exists
    const existingCode = await db.subject.findFirst({
      where: {
        OR: [
          { code: { equals: code, mode: "insensitive" } },
          { name: { equals: name, mode: "insensitive" } },
        ],
      },
    });

    if (existingCode) {
      return { success: false, error: "Tên môn hoặc mã môn học này đã tồn tại." };
    }

    await db.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
      },
    });

    revalidatePath("/admin/subjects");
    revalidatePath("/admin/schedules");
    return { success: true, message: "Thêm môn học thành công." };
  } catch (error) {
    console.error("Error creating subject:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi thêm môn học." };
  }
}

export async function deleteSubject(subjectId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được xoá môn học." };
    }

    await db.subject.delete({
      where: { id: subjectId },
    });

    revalidatePath("/admin/subjects");
    revalidatePath("/admin/schedules");
    return { success: true, message: "Xoá môn học thành công." };
  } catch (error) {
    console.error("Error deleting subject:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá môn học (môn học có thể đang liên kết với lịch học)." };
  }
}
