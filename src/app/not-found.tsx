import React from "react";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";

const HOME_BY_ROLE: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default async function NotFound() {
  // Đọc httpOnly cookie session_token server-side → về dashboard theo role nếu đã đăng nhập
  const session = await getSession();
  const homeHref = session && HOME_BY_ROLE[session.role] ? HOME_BY_ROLE[session.role] : "/";

  return (
    <div className="bg-canvas-parchment min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-canvas border border-hairline rounded-lg p-8 shadow-product flex flex-col items-center text-center animate-fade-in gap-6">

        {/* Animated Clock/Progress Icon */}
        <div className="h-16 w-16 rounded-full bg-blue-50 text-primary flex items-center justify-center shadow-sm relative overflow-hidden">
          <Clock className="h-8 w-8 animate-pulse text-primary" />
          <div className="absolute inset-0 border border-primary/20 rounded-full animate-ping pointer-events-none" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit mx-auto border border-blue-200">
            Coming Soon
          </span>
          <h1 className="font-tagline text-2xl font-bold text-ink leading-tight">
            Tính Năng Đang Phát Triển
          </h1>
          <p className="font-body text-xs text-ink-muted-80 leading-relaxed max-w-[320px] mx-auto">
            Trang này đang được nâng cấp, hoàn thiện nội dung và sẽ sớm ra mắt quý học viên trong thời gian tới.
          </p>
        </div>

        <Link
          href={homeHref}
          className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold text-xs apple-active-scale transition-colors shadow-sm flex items-center gap-1.5 mt-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
