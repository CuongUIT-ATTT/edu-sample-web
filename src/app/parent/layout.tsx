"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { getCurrentUser } from "@/actions/session";
import { EduWebLogo } from "@/components/ui/EduWebLogo";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";
import { usePathname } from "next/navigation";
import {
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

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeSidebar]);

  const isActive = (href: string) => pathname === href;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserEmail(u?.email ?? null))
      .catch(() => setUserEmail(null));
  }, []);

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all apple-active-scale ${
      isActive(href)
        ? "bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-semibold border border-primary/20 dark:border-white/20 shadow-xs"
        : "text-ink-muted-80 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink font-medium"
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

      {/* Unified sidebar */}
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
            href="/parent"
            onClick={closeSidebar}
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

      {/* Main Body */}
      <div className="flex-1 flex flex-col overflow-auto ml-0 md:ml-64">
        {/* Apple sub-nav style Frosted Glass Header */}
        <header className="h-[60px] frosted-glass border-b border-hairline flex items-center justify-between px-4 md:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-canvas text-ink"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <h2 className="font-tagline text-xs sm:text-sm text-ink font-semibold truncate max-w-[200px] sm:max-w-none">
              Bảng Đồng Hành Cùng Học Viên
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <span className="text-xs text-ink-muted-48 hidden sm:inline">
              Phụ huynh: {userEmail ?? ""}
            </span>
            <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              PH
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 w-full p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
