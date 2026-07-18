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
  classIds?: string[]; // for Student - supports multiple classes
  parentId?: string;  // for Student
}

export async function createUser(input: CreateUserInput) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được tạo tài khoản." };
    }

    const { email, name, role, password, classIds, parentId } = input;

    if (!email || !name || !role) {
      return { success: false, error: "Vui lòng nhập đầy đủ email, tên và vai trò." };
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email này đã được sử dụng bởi một tài khoản khác." };
    }

    const defaultPassword = password || "Password@2026";
    const passwordHash = await bcryptjs.hash(defaultPassword, 10);

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
            parentId: parentId || null,
            classes: classIds && classIds.length > 0
              ? { connect: classIds.map((id) => ({ id })) }
              : undefined,
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

export async function updateUser(userId: string, input: Partial<CreateUserInput> & { password?: string }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới được chỉnh sửa tài khoản." };
    }

    const { email, name, role, password, classIds, parentId } = input;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user) {
      return { success: false, error: "Không tìm thấy người dùng." };
    }

    if (email && email !== user.email) {
      const existingEmail = await db.user.findFirst({
        where: { email },
      });
      if (existingEmail) {
        return { success: false, error: "Email này đã được sử dụng bởi một tài khoản khác." };
      }
    }

    // Prepare update data
    const updateData: { email?: string; name?: string; role?: Role; passwordHash?: string } = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password && password.trim() !== "") {
      updateData.passwordHash = await bcryptjs.hash(password, 10);
    }

    await db.$transaction(async (tx) => {
      // 1. Update basic user fields
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      // 2. If role changes, handle profile tables
      if (role && role !== user.role) {
        // Delete old profile
        if (user.role === "ADMIN") await tx.adminProfile.deleteMany({ where: { userId } });
        else if (user.role === "TEACHER") await tx.teacherProfile.deleteMany({ where: { userId } });
        else if (user.role === "STUDENT") await tx.studentProfile.deleteMany({ where: { userId } });
        else if (user.role === "PARENT") await tx.parentProfile.deleteMany({ where: { userId } });

        // Create new profile
        if (role === "ADMIN") await tx.adminProfile.create({ data: { userId } });
        else if (role === "TEACHER") await tx.teacherProfile.create({ data: { userId } });
        if (role === "STUDENT") {
          await tx.studentProfile.create({
            data: {
              userId,
              parentId: parentId || null,
              classes: classIds && classIds.length > 0
                ? { connect: classIds.map((id) => ({ id })) }
                : undefined,
            },
          });
        }
        else if (role === "PARENT") await tx.parentProfile.create({ data: { userId } });
      } else if (role === "STUDENT" || user.role === "STUDENT") {
        // Update student profile class / parent details
        await tx.studentProfile.upsert({
          where: { userId },
          create: {
            userId,
            parentId: parentId || null,
            classes: classIds && classIds.length > 0
              ? { connect: classIds.map((id) => ({ id })) }
              : undefined,
          },
          update: {
            parentId: parentId || null,
            classes: classIds && classIds.length > 0
              ? { set: classIds.map((id) => ({ id })) }
              : { set: [] },
          },
        });
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi chỉnh sửa tài khoản." };
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

export async function bulkDeleteUsers(userIds: string[]) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới thực hiện tác vụ này." };
    }

    await db.user.deleteMany({
      where: { id: { in: userIds } },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá hàng loạt tài khoản." };
  }
}

export async function importUsers(users: CreateUserInput[]) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên mới thực hiện tác vụ này." };
    }

    let successCount = 0;
    let failCount = 0;

    for (const u of users) {
      if (!u.email || !u.name || !u.role) {
        failCount++;
        continue;
      }

      // Check if email already exists
      const existing = await db.user.findUnique({ where: { email: u.email } });
      if (existing) {
        failCount++;
        continue;
      }

      const defaultPassword = u.password || "Password@2026";
      const passwordHash = await bcryptjs.hash(defaultPassword, 10);

      try {
        await db.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: u.email,
              name: u.name,
              role: u.role,
              passwordHash,
            },
          });

          if (u.role === "ADMIN") {
            await tx.adminProfile.create({ data: { userId: newUser.id } });
          } else if (u.role === "TEACHER") {
            await tx.teacherProfile.create({ data: { userId: newUser.id } });
          } else if (u.role === "STUDENT") {
            // Find class ID by class name if classIds are passed as names
            const connectClasses: { id: string }[] = [];
            if (u.classIds && u.classIds.length > 0) {
              for (const classRef of u.classIds) {
                const cls = await tx.class.findFirst({
                  where: { name: { equals: classRef, mode: "insensitive" } },
                });
                if (cls) connectClasses.push({ id: cls.id });
                else connectClasses.push({ id: classRef }); // treat as direct ID fallback
              }
            }
            await tx.studentProfile.create({
              data: {
                userId: newUser.id,
                parentId: u.parentId || null,
                classes: connectClasses.length > 0 ? { connect: connectClasses } : undefined,
              },
            });
          } else if (u.role === "PARENT") {
            await tx.parentProfile.create({ data: { userId: newUser.id } });
          }
        });
        successCount++;
      } catch (err) {
        console.error("Failed to import user row:", u.email, err);
        failCount++;
      }
    }

    revalidatePath("/admin/users");
    return { success: true, successCount, failCount };
  } catch (error) {
    console.error("Error bulk importing users:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi nhập danh sách học viên." };
  }
}
