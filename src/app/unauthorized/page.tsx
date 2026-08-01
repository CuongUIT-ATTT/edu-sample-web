import React from "react";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { getSession } from "@/lib/auth";

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default async function UnauthorizedPage() {
  const session = await getSession();
  const homeHref = session && HOME_BY_ROLE[session.role] ? HOME_BY_ROLE[session.role] : "/";
  return (
    <div className="bg-canvas-parchment min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[440px] w-full bg-canvas border border-hairline rounded-lg p-8 shadow-product flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6">
          <ShieldX className="h-8 w-8" />
        </div>
        
        <h1 className="font-tagline text-2xl font-semibold text-ink mb-3">
          Truy cập bị từ chối
        </h1>
        
        <p className="font-caption text-ink-muted-80 mb-8 leading-relaxed">
          Tài khoản của bạn không có đủ đặc quyền để xem nội dung trang này. Vui lòng liên hệ với quản trị viên nếu bạn nghĩ đây là sự nhầm lẫn.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Link 
            href="/login" 
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full text-center"
          >
            Đăng nhập tài khoản khác
          </Link>
          <Link
            href={homeHref}
            className="text-primary hover:underline font-caption font-semibold mt-2"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
