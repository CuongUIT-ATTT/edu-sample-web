"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { login } from "@/actions/auth";

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

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [homeHref, setHomeHref] = useState("/");
  const [showPassword, setShowPassword] = useState(false);

  // Nếu đã đăng nhập, "Quay lại trang chủ" sẽ về dashboard role thay vì trang khách
  useEffect(() => {
    const role = getSessionRole();
    if (role && HOME_BY_ROLE[role]) setHomeHref(HOME_BY_ROLE[role]);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await login(formData);
      if (response.success && response.role) {
        // Force a page refresh to update headers and clear caching in Middleware
        window.location.href = `/${response.role}`;
      } else {
        setError(response.error || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi hệ thống khi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-canvas-parchment min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[400px] w-full bg-canvas border border-hairline rounded-lg p-8 shadow-product flex flex-col items-center">
        
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2 font-tagline tracking-tight text-ink mb-6 select-none">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-semibold text-xl">EduWeb</span>
        </Link>

        <h1 className="font-tagline text-2xl font-semibold text-ink text-center mb-2 select-none">Đăng nhập cổng thông tin</h1>
        <p className="font-caption text-ink-muted-80 text-center mb-6 select-none">Vui lòng nhập tài khoản được cấp bởi quản trị viên trường.</p>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-xs flex items-start gap-2 w-full mb-6 animate-fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
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
                onClick={() => setShowPassword((v) => !v)}
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
            disabled={loading}
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Đăng nhập"
            )}
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
