"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateUserInput {
  email: string;
  name: string;
  role: Role;
  password?: string;
  classId?: string; // for Student
  parentId?: string; // for Student
}

export async function createUser(input: CreateUserInput) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được tạo tài khoản." };
    }

    const { email, name, role, password, classId, parentId } = input;

    if (!email || !name || !role) {
      return { success: false, error: "Vui lòng nhập đầy đủ email, tên và vai trò." };
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email này đã được sử dụng bởi một tài khoản khác." };
    }

    const defaultPassword = password || "Password@2026";
    const passwordHash = await bcryptjs.hash(defaultPassword, 10);

    // Create user and profile in transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          role,
          passwordHash,
        },
      });

      if (role === "ADMIN") {
        await tx.adminProfile.create({
          data: { userId: newUser.id },
        });
      } else if (role === "TEACHER") {
        await tx.teacherProfile.create({
          data: { userId: newUser.id },
        });
      } else if (role === "STUDENT") {
        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            classId: classId || null,
            parentId: parentId || null,
          },
        });
      } else if (role === "PARENT") {
        await tx.parentProfile.create({
          data: { userId: newUser.id },
        });
      }

      return newUser;
    });

    revalidatePath("/admin/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tạo tài khoản." };
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được xoá tài khoản." };
    }

    await db.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá tài khoản." };
  }
}
