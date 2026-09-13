"use client";

import React, { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { login, type LoginResponse } from "@/actions/auth";
import { EduWebLogo } from "@/components/ui/EduWebLogo";

/** Decode JWT payload từ cookie session_token để biết role */
function getSessionRole(): string | null {
  try {
    const m = document.cookie.match(/(?:^|; )session_token=([^;]+)/);
    if (!m) return null;
    const payload = JSON.parse(atob(decodeURIComponent(m[1]).split(".")[1]));
    return payload?.role?.toLowerCase() || null;
  } catch {
    return null;
  }
}

const HOME_BY_ROLE: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

const INITIAL_STATE: LoginResponse = {
  success: false,
};

export default function LoginPage() {
  const [homeHref, setHomeHref] = useState("/");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);

  useEffect(() => {
    const role = getSessionRole();
    if (role && HOME_BY_ROLE[role]) {
      setHomeHref(HOME_BY_ROLE[role]);
    }
  }, []);

  return (
    <div className="bg-canvas-parchment min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-[420px] w-full bg-canvas border border-hairline rounded-lg p-8 shadow-product flex flex-col items-center">
        <Link href="/" className="mb-6 hover:opacity-90 transition-opacity">
          <EduWebLogo variant="full" size="lg" theme="light" showSubtitle={true} />
        </Link>

        <h1 className="font-tagline text-2xl font-semibold text-ink text-center mb-2 select-none">Đăng nhập cổng thông tin</h1>
        <p className="font-caption text-ink-muted-80 text-center mb-6 select-none">Vui lòng nhập tài khoản được cấp bởi quản trị viên trường.</p>

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-xs flex items-start gap-2 w-full mb-6 animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-caption-strong text-ink text-xs select-none">Email học đường</label>
            <input
              type="email"
              name="email"
              placeholder="example@eduweb.vn"
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-caption-strong text-ink text-xs select-none">Mật khẩu</label>
              <Link href="#" className="text-xs text-primary hover:underline select-none">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer text-ink-muted-48 hover:text-primary transition-colors"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-caption-strong text-ink text-xs select-none">Cổng truy cập</label>
            <select
              name="role"
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full appearance-none"
              required
            >
              <option value="student">Học sinh (Student)</option>
              <option value="parent">Phụ huynh (Parent)</option>
              <option value="teacher">Giáo viên (Teacher)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {pending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href={homeHref} className="text-xs text-ink-muted-48 hover:underline select-none">
            {homeHref === "/" ? "Quay lại trang chủ" : "Về trang quản lý"}
          </Link>
        </div>
      </div>
    </div>
  );
}
