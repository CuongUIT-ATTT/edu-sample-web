"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createRoom(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được quản lý phòng học." };
    }

    const name = formData.get("name") as string;
    const capacityStr = formData.get("capacity") as string;
    const capacity = capacityStr ? parseInt(capacityStr) : null;

    if (!name || name.trim() === "") {
      return { success: false, error: "Tên phòng học không được để trống." };
    }

    const existing = await db.room.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return { success: false, error: "Tên phòng học này đã tồn tại." };
    }

    await db.room.create({
      data: {
        name: name.trim(),
        capacity: capacity && !isNaN(capacity) ? capacity : null,
      },
    });

    revalidatePath("/admin/rooms");
    revalidatePath("/admin/schedules");
    return { success: true, message: "Thêm phòng học thành công." };
  } catch (error) {
    console.error("Error creating room:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi thêm phòng." };
  }
}

export async function updateRoom(roomId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được quản lý phòng học." };
    }

    const name = formData.get("name") as string;
    const capacityStr = formData.get("capacity") as string;
    const capacity = capacityStr ? parseInt(capacityStr) : null;

    if (!name || name.trim() === "") {
      return { success: false, error: "Tên phòng học không được để trống." };
    }

    const existing = await db.room.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: roomId },
      },
    });

    if (existing) {
      return { success: false, error: "Tên phòng học này đã tồn tại." };
    }

    await db.room.update({
      where: { id: roomId },
      data: {
        name: name.trim(),
        capacity: capacity && !isNaN(capacity) ? capacity : null,
      },
    });

    revalidatePath("/admin/rooms");
    revalidatePath("/admin/schedules");
    return { success: true, message: "Cập nhật phòng học thành công." };
  } catch (error) {
    console.error("Error updating room:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi chỉnh sửa phòng." };
  }
}

export async function deleteRoom(roomId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được quản lý phòng học." };
    }

    await db.room.delete({
      where: { id: roomId },
    });

    revalidatePath("/admin/rooms");
    revalidatePath("/admin/schedules");
    return { success: true, message: "Xoá phòng học thành công." };
  } catch (error) {
    console.error("Error deleting room:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá phòng." };
  }
}
