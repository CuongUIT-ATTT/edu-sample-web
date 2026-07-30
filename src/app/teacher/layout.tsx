"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import {
  BookOpen,
  Calendar,
  LogOut,
  CheckSquare,
  TrendingUp,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Menu,
  FileText,
} from "lucide-react";

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeSidebar]);

  const isActive = (href: string) => pathname === href;

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-2 md:px-4 py-2.5 rounded-sm text-sm transition-colors apple-active-scale ${
      isActive(href)
        ? "bg-surface-pearl text-ink font-body-strong border border-divider-soft"
        : "text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption"
    }`;

  return (
    <div className="flex h-screen bg-canvas-parchment overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Unified sidebar: slides in on mobile, always visible on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw]
          flex-col justify-between bg-canvas border-r border-hairline p-3
          transform transition-transform duration-300 ease-in-out shadow-xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:shadow-none md:w-64 md:max-w-none md:p-6
        `}
      >
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <Link
            href="/teacher"
            onClick={closeSidebar}
            className="flex items-center gap-2 font-tagline tracking-tight text-ink"
          >
            <span className="font-semibold text-xs md:text-lg">EduWeb</span>
            <span className="text-[8px] md:text-[10px] bg-green-100 text-green-700 px-1.5 md:px-2 py-0.5 rounded-full font-bold uppercase text-center">
              GV
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/teacher"
              onClick={closeSidebar}
              className={linkClass("/teacher")}
            >
              <LayoutDashboard className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Tổng quan</span>
            </Link>
            <Link
              href="/teacher/attendance"
              onClick={closeSidebar}
              className={linkClass("/teacher/attendance")}
            >
              <CheckSquare className="h-4 w-4 flex-shrink-0" />
              <span>Điểm danh</span>
            </Link>
            <Link
              href="/teacher/grades"
              onClick={closeSidebar}
              className={linkClass("/teacher/grades")}
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span>Bảng điểm</span>
            </Link>
            <Link
              href="/teacher/classes"
              onClick={closeSidebar}
              className={linkClass("/teacher/classes")}
            >
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span>Lớp luyện thi</span>
            </Link>
            <Link
              href="/teacher/calendar"
              onClick={closeSidebar}
              className={linkClass("/teacher/calendar")}
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Lịch</span>
            </Link>
            <Link
              href="/teacher/schedules"
              onClick={closeSidebar}
              className={linkClass("/teacher/schedules")}
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Lịch dạy tuần</span>
            </Link>
            <Link
              href="/teacher/quizzes"
              onClick={closeSidebar}
              className={linkClass("/teacher/quizzes")}
            >
              <HelpCircle className="h-4 w-4 flex-shrink-0" />
              <span>Quản lý bài test</span>
            </Link>
            <Link
              href="/teacher/documents"
              onClick={closeSidebar}
              className={linkClass("/teacher/documents")}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span>Tài liệu học tập</span>
            </Link>
          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="flex flex-col gap-2 border-t border-divider-soft pt-4">
          <Link
            href="/teacher/settings"
            onClick={closeSidebar}
            className={linkClass("/teacher/settings")}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span>Thiết lập</span>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-auto ml-0 md:ml-64">
        {/* Apple sub-nav style Frosted Glass Header */}
        <header className="h-[60px] frosted-glass border-b border-hairline flex items-center justify-between px-4 md:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-canvas text-ink"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-tagline text-xs sm:text-sm text-ink font-semibold truncate max-w-[200px] sm:max-w-none">
              Cổng Quản Lý & Giảng Dạy Luyện Thi
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-ink-muted-48 hidden sm:inline">
              Giảng viên: giangvien@eduweb.vn
            </span>
            <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              GV
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 w-full p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
