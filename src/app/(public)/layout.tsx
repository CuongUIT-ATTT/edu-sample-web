import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { EduWebLogo } from "@/components/ui/EduWebLogo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink transition-colors">
      {/* Apple Global Nav Bar */}
      <nav className="sticky top-0 z-50 h-12 bg-surface-black text-on-dark flex items-center justify-between px-6 font-nav-link border-b border-white/10">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <EduWebLogo variant="full" size="sm" theme="dark" showSubtitle={false} />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold">
            <Link href="/quizzes" className="text-body-muted hover:text-white transition-colors">Thi thử online</Link>
            <Link href="/documents" className="text-body-muted hover:text-white transition-colors">Kho tài liệu</Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle className="h-8 w-8 border-white/10 bg-white/10 text-body-muted hover:bg-white/15 hover:text-white" />
            <Link
              href="/login"
              className="bg-primary hover:bg-primary-focus text-white text-[11px] px-4 py-1.5 rounded-pill apple-active-scale font-semibold transition-all shadow-xs"
            >
              Vào Học Cổng VIP
            </Link>
          </div>
        </div>
      </nav>

      {/* Apple Sub Nav Frosted Glass */}
      <div className="sticky top-12 z-40 h-[52px] frosted-glass border-b border-hairline flex items-center px-4 sm:px-6">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2">
            <EduWebLogo variant="full" size="sm" theme="auto" showSubtitle={true} />
          </Link>
          <div className="hidden md:flex items-center gap-6 font-caption">
            <Link href="/admission" className="text-ink-muted-80 hover:text-primary transition-colors font-semibold">Đăng ký tư vấn lộ trình</Link>
            <Link
              href="/login"
              className="bg-primary hover:bg-primary-focus text-white px-[14px] py-[6px] rounded-pill text-xs font-semibold apple-active-scale transition-colors shadow-sm"
            >
              Đăng nhập VIP
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
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink font-bold">Luyện đề & Thi thử</h4>
              <Link href="/quizzes" className="hover:underline font-dense-link leading-relaxed block text-xs">Ngân hàng đề thi thử công khai</Link>
              <Link href="/documents" className="hover:underline font-dense-link leading-relaxed block text-xs">Kho tài liệu miễn phí</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink font-bold">Tuyển sinh</h4>
              <Link href="/admission" className="hover:underline font-dense-link leading-relaxed block text-xs">Đăng ký nhập học trực tuyến</Link>
              <Link href="/contact" className="hover:underline font-dense-link leading-relaxed block text-xs">Liên hệ trực tiếp ban tuyển sinh</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink font-bold">Cộng đồng ôn thi</h4>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:underline font-dense-link leading-relaxed block text-xs text-blue-600">Fanpage Facebook luyện thi</a>
              <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className="hover:underline font-dense-link leading-relaxed block text-xs text-teal-600">Nhóm tự học hỗ trợ Zalo</a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:underline font-dense-link leading-relaxed block text-xs text-red-600">Kênh bài giảng YouTube</a>
            </div>
          </div>
          <hr className="border-hairline" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-ink-muted-48 text-[11px]">
            <p>Bản quyền © 2026 EduWeb. Mọi quyền được bảo lưu.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:underline">Chính sách bảo mật</Link>
              <Link href="/terms" className="hover:underline">Điều khoản sử dụng</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
