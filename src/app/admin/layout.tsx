"use client";

import React, { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import {
  Users,
  BookOpen,
  Calendar,
  LogOut,
  ShieldAlert,
  LayoutDashboard,
  Settings,
  Home,
  Menu,
  HelpCircle,
  FileText,
} from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-canvas-parchment overflow-hidden">
      {/* Apple-style Dashboard Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-canvas border-r border-hairline flex-col justify-between p-3 md:p-6 flex-shrink-0 transition-all duration-300">
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <Link
            href="/admin"
            className="flex flex-col md:flex-row items-center md:items-start gap-2 font-tagline tracking-tight text-ink justify-center md:justify-start"
          >
            <span className="font-semibold text-xs md:text-lg">EduWeb</span>
            <span className="text-[8px] md:text-[10px] bg-red-100 text-red-700 px-1 md:px-2 py-0.5 rounded-full font-bold uppercase text-center">
              AD
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/admin"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm bg-surface-pearl text-ink font-body-strong text-sm border border-divider-soft"
            >
              <LayoutDashboard className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="hidden md:inline">Tổng quan</span>
            </Link>
            <Link
              href="/admin/users"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Người dùng</span>
            </Link>
            <Link
              href="/admin/quizzes"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <HelpCircle className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Quản lý đề thi</span>
            </Link>
            <Link
              href="/admin/classes"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Lớp luyện thi</span>
            </Link>
            <Link
              href="/admin/subjects"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <span className="hidden md:inline">Môn học</span>
            </Link>
            <Link
              href="/admin/rooms"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <Home className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="hidden md:inline">Phòng học</span>
            </Link>
            <Link
              href="/admin/schedules"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Lịch học lớp</span>
            </Link>
            <Link
              href="/admin/system"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Bảo mật hệ thống</span>
            </Link>
            <Link
              href="/admin/documents"
              onClick={closeSidebar}
              className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors apple-active-scale"
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Quản lý tài liệu</span>
            </Link>
          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="flex flex-col gap-2 border-t border-divider-soft pt-4">
          <Link
            href="/admin/settings"
            onClick={closeSidebar}
            className="flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="hidden md:inline">Thiết lập</span>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-black/40"
            onClick={closeSidebar}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col justify-between bg-canvas border-r border-hairline p-4 shadow-2xl">
            <div className="flex flex-col gap-8">
              <Link
                href="/admin"
                onClick={closeSidebar}
                className="flex items-center gap-2 font-tagline tracking-tight text-ink"
              >
                <span className="font-semibold text-sm">EduWeb</span>
                <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase text-center">
                  AD
                </span>
              </Link>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/admin"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm bg-surface-pearl text-ink font-body-strong text-sm border border-divider-soft"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Tổng quan</span>
                </Link>
                <Link
                  href="/admin/users"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>Người dùng</span>
                </Link>
                <Link
                  href="/admin/quizzes"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <HelpCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Quản lý đề thi</span>
                </Link>
                <Link
                  href="/admin/classes"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span>Lớp luyện thi</span>
                </Link>
                <Link
                  href="/admin/subjects"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span>Môn học</span>
                </Link>
                <Link
                  href="/admin/rooms"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <Home className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span>Phòng học</span>
                </Link>
                <Link
                  href="/admin/schedules"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Lịch học lớp</span>
                </Link>
                <Link
                  href="/admin/system"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>Bảo mật hệ thống</span>
                </Link>
                <Link
                  href="/admin/documents"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span>Quản lý tài liệu</span>
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-2 border-t border-divider-soft pt-4">
              <Link
                href="/admin/settings"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-4 py-2.5 rounded-sm text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption text-sm transition-colors"
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span>Thiết lập</span>
              </Link>
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
          <div className="flex items-center gap-4">
            <span className="text-xs text-ink-muted-48 hidden sm:inline">
              Quản trị viên: admin@eduweb.vn
            </span>
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto w-full p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
