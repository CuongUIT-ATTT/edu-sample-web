"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  roleName: string;
}

export default function DashboardError({
  error,
  reset,
  homeHref,
  roleName,
}: DashboardErrorProps) {
  useEffect(() => {
    if (error) {
      console.error(`[DashboardError:${roleName}]`, error);
    }
  }, [error, roleName]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-md w-full bg-canvas border border-hairline rounded-lg p-8 shadow-product flex flex-col items-center text-center animate-fade-in gap-6">
        {/* Alert Icon */}
        <div className="h-16 w-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full w-fit mx-auto border border-red-200">
            Lỗi Hệ Thống
          </span>
          <h1 className="font-tagline text-2xl font-bold text-ink leading-tight">
            Không thể tải trang {roleName}
          </h1>
          <p className="font-body text-xs text-ink-muted-80 leading-relaxed max-w-[320px] mx-auto">
            Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử tải lại trang hoặc
            quay lại sau ít phút.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <p className="font-mono text-[10px] text-red-400 bg-red-50 border border-red-100 rounded px-3 py-2 mt-2 break-all max-w-[360px] mx-auto">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="bg-primary hover:bg-primary-focus text-white px-5 py-2.5 rounded-pill font-body font-semibold text-xs apple-active-scale transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Tải lại
          </button>
          <a
            href={homeHref}
            className="bg-canvas border border-hairline hover:border-primary text-ink px-5 py-2.5 rounded-pill font-body font-semibold text-xs apple-active-scale transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
