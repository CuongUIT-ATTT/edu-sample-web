"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, AlertCircle, RefreshCw } from "lucide-react";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
            <input 
              type="password" 
              name="password"
              placeholder="••••••••" 
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required 
            />
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
          <Link href="/" className="text-xs text-ink-muted-48 hover:underline select-none">
            Quay lại trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
}
