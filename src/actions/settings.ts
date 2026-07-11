"use server";

import { db } from "@/lib/db";
import { getSession, signJWT } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateProfileSettings(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Bạn chưa đăng nhập." };
    }

    const name = formData.get("name") as string;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!name || name.trim() === "") {
      return { success: false, error: "Họ và tên không được để trống." };
    }

    // 1. Fetch current user from database
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { success: false, error: "Không tìm thấy người dùng." };
    }

    const dataToUpdate: { name: string; passwordHash?: string } = {
      name: name.trim(),
    };

    // 2. Handle password change if requested
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
      }

      const isPasswordValid = await bcryptjs.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return { success: false, error: "Mật khẩu hiện tại không chính xác." };
      }

      dataToUpdate.passwordHash = await bcryptjs.hash(newPassword, 10);
    } else if (newPassword && !currentPassword) {
      return { success: false, error: "Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu." };
    }

    // 3. Update database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    // 4. Re-sign JWT session token with updated name
    const token = await signJWT({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    revalidatePath("/admin/settings");
    revalidatePath("/teacher/settings");
    revalidatePath("/student/settings");
    revalidatePath("/parent/settings");

    return { success: true, message: "Cập nhật thiết lập tài khoản thành công." };
  } catch (error) {
    console.error("Error updating profile settings:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi cập nhật thiết lập." };
  }
}
