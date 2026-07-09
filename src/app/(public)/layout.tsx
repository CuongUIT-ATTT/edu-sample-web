import React from "react";
import Link from "next/link";
import { Search, GraduationCap } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Apple Global Nav Bar */}
      <nav className="sticky top-0 z-50 h-11 bg-surface-black text-on-dark flex items-center justify-between px-6 font-nav-link">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-tagline tracking-tight text-white">
            <GraduationCap className="h-5 w-5 text-primary-on-dark" />
            <span className="font-semibold text-sm">EduWeb</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/courses" className="text-body-muted hover:text-white transition-colors">Khóa học</Link>
            <Link href="/news" className="text-body-muted hover:text-white transition-colors">Tin tức</Link>
            <Link href="/admission" className="text-body-muted hover:text-white transition-colors">Tuyển sinh</Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-body-muted hover:text-white transition-colors apple-active-scale">
              <Search className="h-4 w-4" />
            </button>
            <Link 
              href="/login" 
              className="bg-ink hover:bg-ink-muted-80 text-white text-xs px-3 py-1 rounded-sm apple-active-scale font-button-utility"
            >
              Vào học đường
            </Link>
          </div>
        </div>
      </nav>

      {/* Apple Sub Nav Frosted Glass */}
      <div className="sticky top-11 z-40 h-[52px] frosted-glass border-b border-hairline flex items-center px-6">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          <Link href="/" className="font-tagline text-ink font-semibold">
            EduWeb Portal
          </Link>
          <div className="flex items-center gap-6 font-caption">
            <Link href="/courses" className="text-ink-muted-80 hover:text-primary transition-colors">Tất cả khóa học</Link>
            <Link href="/admission" className="text-ink-muted-80 hover:text-primary transition-colors">Gửi hồ sơ trực tuyến</Link>
            <Link 
              href="/login" 
              className="bg-primary hover:bg-primary-focus text-white px-[14px] py-[6px] rounded-pill text-xs font-semibold apple-active-scale transition-colors shadow-sm"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Content Stack */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Apple Style Footer */}
      <footer className="bg-canvas-parchment text-ink-muted-80 border-t border-hairline py-16 px-6 font-fine-print">
        <div className="max-w-[980px] w-full mx-auto flex flex-col gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink">Khóa học</h4>
              <Link href="/courses?level=elem" className="hover:underline font-dense-link leading-relaxed block text-sm">Tiểu học</Link>
              <Link href="/courses?level=mid" className="hover:underline font-dense-link leading-relaxed block text-sm">Trung học cơ sở</Link>
              <Link href="/courses?level=high" className="hover:underline font-dense-link leading-relaxed block text-sm">Trung học phổ thông</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink">Tuyển sinh</h4>
              <Link href="/admission" className="hover:underline font-dense-link leading-relaxed block text-sm">Quy trình nhập học</Link>
              <Link href="/admission/fees" className="hover:underline font-dense-link leading-relaxed block text-sm">Học phí & Học bổng</Link>
              <Link href="/admission/apply" className="hover:underline font-dense-link leading-relaxed block text-sm">Đăng ký trực tuyến</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink">Giới thiệu</h4>
              <Link href="/about" className="hover:underline font-dense-link leading-relaxed block text-sm">Về EduWeb</Link>
              <Link href="/news" className="hover:underline font-dense-link leading-relaxed block text-sm">Tin tức & Sự kiện</Link>
              <Link href="/contact" className="hover:underline font-dense-link leading-relaxed block text-sm">Liên hệ</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink">Liên hệ</h4>
              <p className="text-xs leading-relaxed text-ink-muted-48">Điện thoại: 1900 1234</p>
              <p className="text-xs leading-relaxed text-ink-muted-48">Email: info@eduweb.vn</p>
              <p className="text-xs leading-relaxed text-ink-muted-48">Địa chỉ: Hà Nội, Việt Nam</p>
            </div>
          </div>
          <hr className="border-hairline" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-ink-muted-48 text-[11px]">
            <p>Bản quyền © 2026 EduWeb Inc. Mọi quyền được bảo lưu.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:underline">Chính sách bảo mật</Link>
              <Link href="/terms" className="hover:underline">Điều khoản sử dụng</Link>
              <Link href="/map" className="hover:underline">Sơ đồ trang</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
