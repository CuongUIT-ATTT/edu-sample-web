"use server";

import { getSession } from "@/lib/auth";

/**
 * Trả về thông tin người dùng đang đăng nhập (đọc từ session cookie).
 * Dùng cho layout client (client component không gọi được getSession() trực tiếp).
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return { email: session.email, name: session.name };
}
