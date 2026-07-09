import React from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { 
  Calendar, 
  LogOut, 
  CheckSquare, 
  TrendingUp,
  LayoutDashboard,
  Settings
} from "lucide-react";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-canvas-parchment overflow-hidden">
      {/* Apple-style Dashboard Sidebar */}
      <aside className="w-64 bg-canvas border-r border-hairline flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-2 font-tagline tracking-tight text-ink">
            <span className="font-semibold text-lg">EduWeb</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Học sinh</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link 
              href="/student" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-sm bg-surface-pearl text-ink font-body-strong text-sm border border-divider-soft"
            >
              <LayoutDashboard className="h-4 w-4 text-primary" />
              Tổng quan
            </Link>
            <Link 
              href="/student/schedules" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <Calendar className="h-4 w-4" />
              Thời khóa biểu
            </Link>
            <Link 
              href="/student/attendance" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <CheckSquare className="h-4 w-4" />
              Chuyên cần
            </Link>
            <Link 
              href="/student/grades" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <TrendingUp className="h-4 w-4" />
              Kết quả học tập
            </Link>
          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="flex flex-col gap-2 border-t border-divider-soft pt-4">
          <Link 
            href="/student/settings" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
          >
            <Settings className="h-4 w-4" />
            Thiết lập
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Apple sub-nav style Frosted Glass Header */}
        <header className="h-[60px] frosted-glass border-b border-hairline flex items-center justify-between px-8 z-30 sticky top-0">
          <h2 className="font-tagline text-sm text-ink font-semibold">
            Bảng Tra Cứu Học Tập Học Sinh
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-ink-muted-48">Học sinh: hocsinh@eduweb.vn</span>
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              HS
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
