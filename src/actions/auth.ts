"use server";

import { db } from "@/lib/db";
import { signJWT } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { cookies } from "next/headers";

interface LoginResponse {
  success: boolean;
  error?: string;
  role?: string;
}

export async function login(formData: FormData): Promise<LoginResponse> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const requestedRole = formData.get("role") as string; // "admin" | "teacher" | "student" | "parent"

  if (!email || !password || !requestedRole) {
    return { success: false, error: "Vui lòng nhập đầy đủ thông tin đăng nhập." };
  }

  try {
    // 1. Fetch user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Tài khoản hoặc mật khẩu không chính xác." };
    }

    // 2. Verify role matches
    if (user.role !== requestedRole.toUpperCase()) {
      return { success: false, error: "Tài khoản không được phân quyền truy cập cổng này." };
    }

    // 3. Verify password hash using bcryptjs
    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Tài khoản hoặc mật khẩu không chính xác." };
    }

    // 4. Sign JWT session payload
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // 5. Store JWT in an httpOnly secure cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return { success: true, role: user.role.toLowerCase() };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi đăng nhập." };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session_token");
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    return { success: false };
  }
}
