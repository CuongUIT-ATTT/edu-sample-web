"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { getCurrentUser } from "@/actions/session";
import { EduWebLogo } from "@/components/ui/EduWebLogo";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";
import {
  Users,
  BookOpen,
  Calendar,
  ShieldAlert,
  LayoutDashboard,
  Settings,
  Home,
  Menu,
  HelpCircle,
  FileText,
  DollarSign,
  ClipboardCheck,
} from "lucide-react";

export default function AdminDashboardLayout({
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

  // Email thật của người đang đăng nhập (layout client không gọi được getSession() trực tiếp)
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserEmail(u?.email ?? null))
      .catch(() => setUserEmail(null));
  }, []);

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
            href="/admin"
            onClick={closeSidebar}
            className="flex items-center gap-2"
          >
            <EduWebLogo variant="full" size="sm" theme="auto" showSubtitle={false} />
            <span className="text-[8px] md:text-[10px] bg-red-100 text-red-700 px-1.5 md:px-2 py-0.5 rounded-full font-bold uppercase text-center ml-auto">
              ADMIN
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/admin"
              onClick={closeSidebar}
              className={linkClass("/admin")}
            >
              <StitchIconBadge
                icon={LayoutDashboard}
                variant="blue"
                size="sm"
                isActive={isActive("/admin")}
              />
              <span>Tổng quan</span>
            </Link>
            <Link
              href="/admin/users"
              onClick={closeSidebar}
              className={linkClass("/admin/users")}
            >
              <StitchIconBadge
                icon={Users}
                variant="indigo"
                size="sm"
                isActive={isActive("/admin/users")}
              />
              <span>Người dùng</span>
            </Link>
            <Link
              href="/admin/classes"
              onClick={closeSidebar}
              className={linkClass("/admin/classes")}
            >
              <StitchIconBadge
                icon={BookOpen}
                variant="purple"
                size="sm"
                isActive={isActive("/admin/classes")}
              />
              <span>Lớp luyện thi</span>
            </Link>
            <Link
              href="/admin/subjects"
              onClick={closeSidebar}
              className={linkClass("/admin/subjects")}
            >
              <StitchIconBadge
                icon={Calendar}
                variant="teal"
                size="sm"
                isActive={isActive("/admin/subjects")}
              />
              <span>Môn học</span>
            </Link>
            <Link
              href="/admin/rooms"
              onClick={closeSidebar}
              className={linkClass("/admin/rooms")}
            >
              <StitchIconBadge
                icon={Home}
                variant="amber"
                size="sm"
                isActive={isActive("/admin/rooms")}
              />
              <span>Phòng học</span>
            </Link>
            <Link
              href="/admin/calendar"
              onClick={closeSidebar}
              className={linkClass("/admin/calendar")}
            >
              <StitchIconBadge
                icon={Calendar}
                variant="cyan"
                size="sm"
                isActive={isActive("/admin/calendar")}
              />
              <span>Lịch</span>
            </Link>
            <Link
              href="/admin/quizzes"
              onClick={closeSidebar}
              className={linkClass("/admin/quizzes")}
            >
              <StitchIconBadge
                icon={HelpCircle}
                variant="rose"
                size="sm"
                isActive={isActive("/admin/quizzes")}
              />
              <span>Quản lý đề thi</span>
            </Link>
            <Link
              href="/admin/documents"
              onClick={closeSidebar}
              className={linkClass("/admin/documents")}
            >
              <StitchIconBadge
                icon={FileText}
                variant="emerald"
                size="sm"
                isActive={isActive("/admin/documents")}
              />
              <span>Quản lý tài liệu</span>
            </Link>
            <Link
              href="/admin/tuition"
              onClick={closeSidebar}
              className={linkClass("/admin/tuition")}
            >
              <StitchIconBadge
                icon={DollarSign}
                variant="amber"
                size="sm"
                isActive={isActive("/admin/tuition")}
              />
              <span>Học phí</span>
            </Link>
            <Link
              href="/admin/attendance"
              onClick={closeSidebar}
              className={linkClass("/admin/attendance")}
            >
              <StitchIconBadge
                icon={ClipboardCheck}
                variant="blue"
                size="sm"
                isActive={isActive("/admin/attendance")}
              />
              <span>Điểm danh</span>
            </Link>
            <Link
              href="/admin/system"
              onClick={closeSidebar}
              className={linkClass("/admin/system")}
            >
              <StitchIconBadge
                icon={ShieldAlert}
                variant="red"
                size="sm"
                isActive={isActive("/admin/system")}
              />
              <span>Bảo mật hệ thống</span>
            </Link>
          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="flex flex-col gap-1.5 border-t border-divider-soft pt-4">
          <Link
            href="/admin/settings"
            onClick={closeSidebar}
            className={linkClass("/admin/settings")}
          >
            <StitchIconBadge
              icon={Settings}
              variant="slate"
              size="sm"
              isActive={isActive("/admin/settings")}
            />
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
              Quản Trị Luyện Thi
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <span className="text-xs text-ink-muted-48 hidden sm:inline">
              Quản trị viên: {userEmail ?? ""}
            </span>
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 w-full p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
