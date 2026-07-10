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
          <Link href="/" className="flex items-center gap-2 font-tagline tracking-tight text-white select-none">
            <GraduationCap className="h-5 w-5 text-primary-on-dark animate-pulse" />
            <span className="font-semibold text-sm">Luyện Thi Hùng Cường</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold">
            <Link href="/courses" className="text-body-muted hover:text-white transition-colors">Khóa học</Link>
            <Link href="/quizzes" className="text-body-muted hover:text-white transition-colors">Thi thử online</Link>
            <Link href="/learning-paths" className="text-body-muted hover:text-white transition-colors">Lộ trình học tập</Link>
            <Link href="/documents" className="text-body-muted hover:text-white transition-colors">Kho tài liệu</Link>
            <Link href="/leaderboard" className="text-body-muted hover:text-white transition-colors">Bảng xếp hạng</Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-body-muted hover:text-white transition-colors apple-active-scale">
              <Search className="h-4 w-4" />
            </button>
            <Link 
              href="/login" 
              className="bg-ink hover:bg-ink-muted-80 text-white text-[11px] px-3.5 py-1.5 rounded-sm apple-active-scale font-semibold transition-all"
            >
              Vào Học Cổng VIP
            </Link>
          </div>
        </div>
      </nav>

      {/* Apple Sub Nav Frosted Glass */}
      <div className="sticky top-11 z-40 h-[52px] frosted-glass border-b border-hairline flex items-center px-6">
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
          <Link href="/" className="font-tagline text-ink font-bold text-sm tracking-tight">
            EduWeb Portal
          </Link>
          <div className="flex items-center gap-6 font-caption">
            <Link href="/courses" className="text-ink-muted-80 hover:text-primary transition-colors font-semibold">Tất cả khóa học</Link>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink font-bold">Khóa học & Luyện đề</h4>
              <Link href="/courses" className="hover:underline font-dense-link leading-relaxed block text-xs">Luyện thi tốt nghiệp THPT</Link>
              <Link href="/quizzes" className="hover:underline font-dense-link leading-relaxed block text-xs">Ngân hàng đề thi thử</Link>
              <Link href="/learning-paths" className="hover:underline font-dense-link leading-relaxed block text-xs">Lộ trình bứt phá điểm 8+, 9+</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink font-bold">Tuyển sinh & Học phí</h4>
              <Link href="/admission" className="hover:underline font-dense-link leading-relaxed block text-xs">Đăng ký nhập học trực tuyến</Link>
              <Link href="/admission/fees" className="hover:underline font-dense-link leading-relaxed block text-xs">Học phí & Quỹ học bổng</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-caption-strong text-ink font-bold">Giới thiệu & Hỗ trợ</h4>
              <Link href="/about" className="hover:underline font-dense-link leading-relaxed block text-xs">Về Thầy Hùng Cường</Link>
              <Link href="/contact" className="hover:underline font-dense-link leading-relaxed block text-xs">Liên hệ trực tiếp ban tuyển sinh</Link>
              <Link href="/documents" className="hover:underline font-dense-link leading-relaxed block text-xs">Kho tài liệu miễn phí</Link>
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
            <p>Bản quyền © 2026 Luyện Thi Hùng Cường Inc. Mọi quyền được bảo lưu.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:underline">Chính sách bảo mật</Link>
              <Link href="/terms" className="hover:underline">Điều khoản sử dụng</Link>
              <Link href="/sitemap.xml" className="hover:underline">Sơ đồ trang XML</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
