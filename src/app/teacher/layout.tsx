import React from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { 
  BookOpen, 
  Calendar, 
  LogOut, 
  CheckSquare, 
  TrendingUp,
  LayoutDashboard,
  Settings,
  HelpCircle
} from "lucide-react";

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-canvas-parchment overflow-hidden">
      {/* Apple-style Dashboard Sidebar */}
      <aside className="w-16 md:w-64 bg-canvas border-r border-hairline flex flex-col justify-between p-3 md:p-6 flex-shrink-0 transition-all duration-300">
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <Link href="/teacher" className="flex flex-col md:flex-row items-center md:items-start gap-2 font-tagline tracking-tight text-ink justify-center md:justify-start">
            <span className="font-semibold text-xs md:text-lg">EduWeb</span>
            <span className="text-[8px] md:text-[10px] bg-green-100 text-green-700 px-1 md:px-2 py-0.5 rounded-full font-bold uppercase text-center">GV</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link 
              href="/teacher" 
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm bg-surface-pearl text-ink font-body-strong text-sm border border-divider-soft"
            >
              <LayoutDashboard className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="hidden md:inline">Tổng quan</span>
            </Link>
            <Link 
              href="/teacher/attendance" 
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <CheckSquare className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Điểm danh</span>
            </Link>
            <Link 
              href="/teacher/grades" 
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Bảng điểm</span>
            </Link>
            <Link 
              href="/teacher/classes" 
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Lớp luyện thi</span>
            </Link>
            <Link 
              href="/teacher/schedules" 
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Lịch dạy tuần</span>
            </Link>
            <Link 
              href="/teacher/quizzes" 
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <HelpCircle className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Quản lý bài test</span>
            </Link>
          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="flex flex-col gap-2 border-t border-divider-soft pt-4">
          <Link 
            href="/teacher/settings" 
            className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="hidden md:inline">Thiết lập</span>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Apple sub-nav style Frosted Glass Header */}
        <header className="h-[60px] frosted-glass border-b border-hairline flex items-center justify-between px-4 md:px-8 z-30 sticky top-0">
          <h2 className="font-tagline text-xs sm:text-sm text-ink font-semibold truncate max-w-[200px] sm:max-w-none">
            Cổng Quản Lý & Giảng Dạy Luyện Thi
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-ink-muted-48 hidden sm:inline">Giảng viên: giangvien@eduweb.vn</span>
            <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              GV
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
