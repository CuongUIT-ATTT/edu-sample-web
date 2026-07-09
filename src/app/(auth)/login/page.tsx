import React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="bg-canvas-parchment min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[400px] w-full bg-canvas border border-hairline rounded-lg p-8 shadow-product flex flex-col items-center">
        
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2 font-tagline tracking-tight text-ink mb-6">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-semibold text-xl">EduWeb</span>
        </Link>

        <h1 className="font-tagline text-2xl font-semibold text-ink text-center mb-2">Đăng nhập cổng thông tin</h1>
        <p className="font-caption text-ink-muted-80 text-center mb-8">Vui lòng nhập tài khoản được cấp bởi quản trị viên trường.</p>

        {/* Mock Login Form */}
        <form className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-caption-strong text-ink text-xs">Email học đường</label>
            <input 
              type="email" 
              placeholder="example@eduweb.vn" 
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-caption-strong text-ink text-xs">Mật khẩu</label>
              <Link href="#" className="text-xs text-primary hover:underline">Quên mật khẩu?</Link>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-caption-strong text-ink text-xs">Cổng truy cập</label>
            <select 
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
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4"
          >
            Đăng nhập
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-ink-muted-48 hover:underline">
            Quay lại trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
}
