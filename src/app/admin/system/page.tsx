import React from "react";
import { ShieldAlert, Server, Key, Terminal, RefreshCw, Activity } from "lucide-react";
import { db } from "@/lib/db";

export default async function AdminSystemPage() {
  let dbStatus = "ONLINE";
  let dbUrlSnippet = "postgresql://***.neon.tech/neondb";
  let usersCount = 0;

  try {
    usersCount = await db.user.count();
  } catch (e) {
    dbStatus = "OFFLINE";
    console.error(e);
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Bảo mật hệ thống</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Trạng thái hạ tầng, khoá mã hoá và nhật ký hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-caption-strong text-ink-muted-48 uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Cơ sở dữ liệu
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${dbStatus === "ONLINE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {dbStatus}
            </span>
          </div>

          <div className="flex flex-col gap-3 border-t border-divider-soft pt-4">
            <div className="flex justify-between text-sm font-caption">
              <span className="text-ink-muted-80">Địa chỉ DB:</span>
              <span className="font-mono text-ink text-xs select-all">{dbUrlSnippet}</span>
            </div>
            <div className="flex justify-between text-sm font-caption">
              <span className="text-ink-muted-80">Tổng số người dùng:</span>
              <span className="font-semibold text-ink">{usersCount}</span>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-caption-strong text-ink-muted-48 uppercase tracking-wider flex items-center gap-2">
              <Key className="h-4 w-4 text-yellow-600" />
              Khoá phiên làm việc (JWT)
            </h3>
            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase">
              HS256 Active
            </span>
          </div>

          <div className="flex flex-col gap-3 border-t border-divider-soft pt-4">
            <div className="flex justify-between text-sm font-caption">
              <span className="text-ink-muted-80">Thời gian hết hạn:</span>
              <span className="font-semibold text-ink">24 giờ (86400 giây)</span>
            </div>
            <div className="flex justify-between text-sm font-caption">
              <span className="text-ink-muted-80">Trạng thái bảo mật:</span>
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" /> An toàn
              </span>
            </div>
          </div>
        </div>

        {/* Logging Console mock */}
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm col-span-1 md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-caption-strong text-ink-muted-48 uppercase tracking-wider">
            <Terminal className="h-4 w-4 text-red-600" />
            Nhật ký phiên kiểm thử UAT gần đây
          </div>
          <div className="bg-ink-muted-8 bg-slate-900 text-slate-300 font-mono text-xs p-4 rounded-lg flex flex-col gap-2 overflow-x-auto select-all">
            <p className="text-slate-500">[2026-07-09 20:39:14] SYSTEM restart complete. Running Next.js 16.0.0-beta</p>
            <p className="text-green-400">[2026-07-09 20:47:33] Migration applied: 20260709134729_init_schema</p>
            <p className="text-green-400">[2026-07-09 20:48:01] Database seeding succeeded. Created 4 roles default credentials.</p>
            <p className="text-blue-400">[2026-07-09 20:57:25] UAT login test initiated for student@tenschool.edu.vn</p>
            <p className="text-green-400">[2026-07-09 20:58:16] Session established successfully. Redirected /login &rarr; /student (302)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
