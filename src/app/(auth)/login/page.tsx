"use client";

import React, { useActionState, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Eye, EyeOff, ArrowRight, Lock } from "lucide-react";
import { login, type LoginResponse } from "@/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import { EduWebLogo } from "@/components/ui/EduWebLogo";

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
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("student");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);

  useEffect(() => {
    const role = getSessionRole();
    if (role && HOME_BY_ROLE[role]) {
      setHomeHref(HOME_BY_ROLE[role]);
    }
  }, []);

  return (
    <div className="relative bg-canvas min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden transition-colors duration-300">
      {/* Radiant Background Blur */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,204,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.12),transparent_50%)]" />

      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <div className="relative max-w-[460px] w-full z-10 animate-fade-in">
        {/* Glass Card Container */}
        <div className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
          <Link href="/" className="mb-6 hover:opacity-90 transition-opacity">
            <EduWebLogo variant="full" size="lg" theme="auto" showSubtitle={true} />
          </Link>

          <div className="text-center mb-6">
            <h1 className="font-tagline text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mb-2">
              Đăng nhập hệ thống
            </h1>
            <p className="font-caption text-ink-muted-80 text-xs sm:text-sm">
              Cổng thông tin đào tạo & khảo thí EduWeb
            </p>
          </div>

          {state.error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5 w-full mb-6 animate-fade-in">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-rose-500" />
              <span className="font-semibold">{state.error}</span>
            </div>
          )}

          <form action={formAction} className="w-full flex flex-col gap-4">
            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-caption-strong text-ink text-xs font-bold select-none">
                Email tài khoản *
              </label>
              <input
                type="email"
                name="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="example@eduweb.vn"
                className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-xs sm:text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                required
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-caption-strong text-ink text-xs font-bold select-none">
                  Mật khẩu *
                </label>
                <Link href="#" className="text-xs text-primary font-bold hover:underline select-none">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-xs sm:text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full pr-12 placeholder:text-ink-muted-48"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer text-ink-muted-48 hover:text-primary transition-colors p-1"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Select */}
            <div className="flex flex-col gap-1.5">
              <label className="font-caption-strong text-ink text-xs font-bold select-none">
                Cổng truy cập *
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-xs sm:text-sm font-semibold outline-none focus:border-primary transition-all w-full appearance-none pr-10 cursor-pointer"
                  required
                >
                  <option value="student">Học sinh (Student)</option>
                  <option value="parent">Phụ huynh (Parent)</option>
                  <option value="teacher">Giáo viên (Teacher)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
                <Lock className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted-48" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pending}
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary-focus hover:to-blue-700 text-white px-6 py-3.5 rounded-full font-body font-extrabold text-sm sm:text-base apple-active-scale transition-all shadow-xl shadow-primary/25 w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-6">
            <Link href={homeHref} className="text-xs text-ink-muted-48 hover:text-primary font-semibold transition-colors select-none">
              {homeHref === "/" ? "← Quay lại trang chủ" : "← Về trang quản lý tài khoản"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
