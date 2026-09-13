"use client";

import React, { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { EduWebLogo } from "@/components/ui/EduWebLogo";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  TrendingUp,
  LayoutDashboard,
  Settings,
  Users,
  Menu,
  DollarSign,
} from "lucide-react";

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setSidebarOpen(false);
  const isActive = (href: string) => pathname === href;

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-2 md:px-4 py-2.5 rounded-sm text-sm transition-colors apple-active-scale ${
      isActive(href)
        ? "bg-surface-pearl text-ink font-body-strong border border-divider-soft"
        : "text-ink-muted-80 hover:bg-surface-pearl hover:text-ink font-caption"
    }`;

  return (
    <div className="flex h-screen bg-canvas-parchment overflow-hidden">
      {/* Apple-style Dashboard Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-canvas border-r border-hairline flex-col justify-between p-3 md:p-6 flex-shrink-0 transition-all duration-300">
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <Link
            href="/parent"
            className="flex items-center gap-2"
          >
            <EduWebLogo variant="full" size="sm" theme="auto" showSubtitle={false} />
            <span className="text-[8px] md:text-[10px] bg-purple-100 text-purple-700 px-1.5 md:px-2 py-0.5 rounded-full font-bold uppercase text-center ml-auto">
              PH
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/parent"
              onClick={closeSidebar}
              className={linkClass("/parent")}
            >
              <StitchIconBadge
                icon={LayoutDashboard}
                variant="blue"
                size="sm"
                isActive={isActive("/parent")}
              />
              <span>Tổng quan</span>
            </Link>
            <Link
              href="/parent/children"
              onClick={closeSidebar}
              className={linkClass("/parent/children")}
            >
              <StitchIconBadge
                icon={Users}
                variant="indigo"
                size="sm"
                isActive={isActive("/parent/children")}
              />
              <span>Thông tin học viên</span>
            </Link>
            <Link
              href="/parent/attendance"
              onClick={closeSidebar}
              className={linkClass("/parent/attendance")}
            >
              <StitchIconBadge
                icon={CheckSquare}
                variant="emerald"
                size="sm"
                isActive={isActive("/parent/attendance")}
              />
              <span>Theo dõi chuyên cần</span>
            </Link>
            <Link
              href="/parent/grades"
              onClick={closeSidebar}
              className={linkClass("/parent/grades")}
            >
              <StitchIconBadge
                icon={TrendingUp}
                variant="purple"
                size="sm"
                isActive={isActive("/parent/grades")}
              />
              <span>Báo cáo điểm thi thử</span>
            </Link>
            <Link
              href="/parent/payment"
              onClick={closeSidebar}
              className={linkClass("/parent/payment")}
            >
              <StitchIconBadge
                icon={DollarSign}
                variant="amber"
                size="sm"
                isActive={isActive("/parent/payment")}
              />
              <span>Học phí</span>
            </Link>
          </nav>
        </div>

        {/* Footer Utilities */}
        <div className="flex flex-col gap-1.5 border-t border-divider-soft pt-4">
          <Link
            href="/parent/settings"
            onClick={closeSidebar}
            className={linkClass("/parent/settings")}
          >
            <StitchIconBadge
              icon={Settings}
              variant="slate"
              size="sm"
              isActive={isActive("/parent/settings")}
            />
            <span>Thiết lập</span>
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
                href="/parent"
                onClick={closeSidebar}
                className="flex items-center gap-2"
              >
                <EduWebLogo variant="full" size="sm" theme="auto" showSubtitle={false} />
                <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold uppercase text-center ml-auto">
                  PH
                </span>
              </Link>
              <nav className="flex flex-col gap-1.5">
                <Link
                  href="/parent"
                  onClick={closeSidebar}
                  className={linkClass("/parent")}
                >
                  <StitchIconBadge
                    icon={LayoutDashboard}
                    variant="blue"
                    size="sm"
                    isActive={isActive("/parent")}
                  />
                  <span>Tổng quan</span>
                </Link>
                <Link
                  href="/parent/children"
                  onClick={closeSidebar}
                  className={linkClass("/parent/children")}
                >
                  <StitchIconBadge
                    icon={Users}
                    variant="indigo"
                    size="sm"
                    isActive={isActive("/parent/children")}
                  />
                  <span>Thông tin học viên</span>
                </Link>
                <Link
                  href="/parent/attendance"
                  onClick={closeSidebar}
                  className={linkClass("/parent/attendance")}
                >
                  <StitchIconBadge
                    icon={CheckSquare}
                    variant="emerald"
                    size="sm"
                    isActive={isActive("/parent/attendance")}
                  />
                  <span>Theo dõi chuyên cần</span>
                </Link>
                <Link
                  href="/parent/grades"
                  onClick={closeSidebar}
                  className={linkClass("/parent/grades")}
                >
                  <StitchIconBadge
                    icon={TrendingUp}
                    variant="purple"
                    size="sm"
                    isActive={isActive("/parent/grades")}
                  />
                  <span>Báo cáo điểm thi thử</span>
                </Link>
                <Link
                  href="/parent/payment"
                  onClick={closeSidebar}
                  className={linkClass("/parent/payment")}
                >
                  <StitchIconBadge
                    icon={DollarSign}
                    variant="amber"
                    size="sm"
                    isActive={isActive("/parent/payment")}
                  />
                  <span>Học phí</span>
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-divider-soft pt-4">
              <Link
                href="/parent/settings"
                onClick={closeSidebar}
                className={linkClass("/parent/settings")}
              >
                <StitchIconBadge
                  icon={Settings}
                  variant="slate"
                  size="sm"
                  isActive={isActive("/parent/settings")}
                />
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
              Bảng Đồng Hành Cùng Học Viên
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <span className="text-xs text-ink-muted-48 hidden sm:inline">
              Phụ huynh: phuhuynh@eduweb.vn
            </span>
            <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              PH
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
