import React, { Suspense } from "react";
import {
  ShieldAlert, Server, Key, Activity, UserPlus,
  BookOpen, FileText, ClipboardList, LogIn, Users,
} from "lucide-react";
import { db } from "@/lib/db";
import SystemActivityFilter from "./SystemActivityFilter";

export const dynamic = "force-dynamic";

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type ActivityEntry = {
  id: string;
  type: "user" | "quiz" | "homework" | "document" | "system";
  title: string;
  actor: string;
  timestamp: Date;
};

/** Build a Prisma date range filter from URL search params */
function buildDateFilter(
  period: string | null,
  from: string | null,
  to: string | null
): { gte?: Date; lte?: Date } | undefined {
  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  if (period === "week") {
    const start = new Date(now);
    const day = start.getDay(); // 0 = Sunday
    const diff = (day === 0 ? -6 : 1 - day); // Monday as week start
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  if (from || to) {
    const filter: { gte?: Date; lte?: Date } = {};
    if (from) {
      const d = new Date(from);
      d.setHours(0, 0, 0, 0);
      filter.gte = d;
    }
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      filter.lte = d;
    }
    return filter;
  }

  return undefined;
}

export default async function AdminSystemPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || null;
  const from = params.from || null;
  const to = params.to || null;

  const dateFilter = buildDateFilter(period, from, to);

  let dbStatus = "ONLINE";
  let usersCount = 0;
  let teachersCount = 0;
  let studentsCount = 0;
  let activities: ActivityEntry[] = [];

  try {
    usersCount = await db.user.count();
    teachersCount = await db.teacherProfile.count();
    studentsCount = await db.studentProfile.count();

    // Gather activities with optional date filter
    const [recentUsers, recentQuizSubs, recentHomeworkSubs, recentDocs] = await Promise.all([
      db.user.findMany({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.quizSubmission.findMany({
        where: dateFilter ? { submittedAt: dateFilter } : undefined,
        orderBy: { submittedAt: "desc" },
        take: 30,
        include: {
          quiz: true,
          student: { include: { user: true } },
        },
      }),
      db.homeworkSubmission.findMany({
        where: dateFilter ? { submittedAt: dateFilter } : undefined,
        orderBy: { submittedAt: "desc" },
        take: 30,
        include: {
          series: { include: { class: true, subject: true } },
          student: { include: { user: true } },
        },
      }),
      db.document.findMany({
        where: dateFilter ? { createdAt: dateFilter } : undefined,
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    recentUsers.forEach((u) => {
      let roleText = "Người dùng";
      if (u.role === "TEACHER") roleText = "Giảng viên";
      else if (u.role === "STUDENT") roleText = "Học viên";
      else if (u.role === "PARENT") roleText = "Phụ huynh";
      else if (u.role === "ADMIN") roleText = "Quản trị viên";
      activities.push({
        id: `user-${u.id}`,
        type: "user",
        title: `Tạo tài khoản ${roleText}: ${u.name}`,
        actor: u.email,
        timestamp: u.createdAt,
      });
    });

    recentQuizSubs.forEach((qs) => {
      const name = qs.student ? qs.student.user.name : (qs.guestName || "Khách");
      const email = qs.student ? qs.student.user.email : "—";
      activities.push({
        id: `quiz-${qs.id}`,
        type: "quiz",
        title: `Nộp bài thi: ${qs.quiz.title} — ${qs.score.toFixed(1)}đ`,
        actor: `${name} (${email})`,
        timestamp: qs.submittedAt,
      });
    });

    recentHomeworkSubs.forEach((hs) => {
      activities.push({
        id: `hw-${hs.id}`,
        type: "homework",
        title: `Nộp bài tập: ${hs.series.subject?.name || "BTVH"} — Lớp ${hs.series.class.name}`,
        actor: `${hs.student.user.name} (${hs.student.user.email})`,
        timestamp: hs.submittedAt,
      });
    });

    recentDocs.forEach((d) => {
      activities.push({
        id: `doc-${d.id}`,
        type: "document",
        title: `Đăng tài liệu: ${d.title}`,
        actor: "Admin",
        timestamp: d.createdAt,
      });
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    activities = activities.slice(0, 60);
  } catch (e) {
    dbStatus = "OFFLINE";
    console.error(e);
  }

  const typeConfig: Record<ActivityEntry["type"], { icon: React.ReactNode; color: string; label: string }> = {
    user: {
      icon: <UserPlus className="h-4 w-4" />,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      label: "Người dùng",
    },
    quiz: {
      icon: <BookOpen className="h-4 w-4" />,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      label: "Bài thi",
    },
    homework: {
      icon: <ClipboardList className="h-4 w-4" />,
      color: "bg-orange-50 text-orange-600 border-orange-200",
      label: "Bài tập",
    },
    document: {
      icon: <FileText className="h-4 w-4" />,
      color: "bg-green-50 text-green-600 border-green-200",
      label: "Tài liệu",
    },
    system: {
      icon: <LogIn className="h-4 w-4" />,
      color: "bg-slate-50 text-slate-600 border-slate-200",
      label: "Hệ thống",
    },
  };

  // Period label for display
  const periodLabel =
    period === "today" ? "Hôm nay" :
    period === "week" ? "Tuần này" :
    period === "month" ? "Tháng này" :
    (from || to) ? `${from || "..."} → ${to || "..."}` :
    "Toàn bộ";

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Hoạt động hệ thống</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Nhật ký toàn bộ hoạt động diễn ra trong hệ thống EduWeb
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Server className="h-4 w-4 text-primary" />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${dbStatus === "ONLINE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {dbStatus}
            </span>
          </div>
          <p className="text-xs text-ink-muted-48 font-semibold uppercase tracking-wide">Database</p>
          <p className="text-sm font-bold text-ink">Neon PostgreSQL</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <p className="text-xs text-ink-muted-48 font-semibold uppercase tracking-wide">Tổng người dùng</p>
          <p className="text-2xl font-bold text-ink">{usersCount}</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-2">
          <ShieldAlert className="h-4 w-4 text-green-600" />
          <p className="text-xs text-ink-muted-48 font-semibold uppercase tracking-wide">Giảng viên</p>
          <p className="text-2xl font-bold text-ink">{teachersCount}</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-2">
          <Key className="h-4 w-4 text-yellow-600" />
          <p className="text-xs text-ink-muted-48 font-semibold uppercase tracking-wide">Học viên</p>
          <p className="text-2xl font-bold text-ink">{studentsCount}</p>
        </div>
      </div>

      {/* JWT Info */}
      <div className="bg-canvas border border-hairline rounded-lg p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-yellow-600" />
          <h3 className="text-xs font-semibold text-ink-muted-48 uppercase tracking-wider">Phiên xác thực (JWT)</h3>
          <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase ml-auto">HS256 Active</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-divider-soft">
          <div>
            <p className="text-xs text-ink-muted-48">Thời gian hết hạn</p>
            <p className="font-semibold text-ink">24 giờ (86.400 giây)</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted-48">Trạng thái bảo mật</p>
            <p className="font-semibold text-green-600 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> An toàn
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <Suspense fallback={<div className="h-24 bg-canvas border border-hairline rounded-lg animate-pulse" />}>
        <SystemActivityFilter />
      </Suspense>

      {/* Activity Timeline */}
      <div className="bg-canvas border border-hairline rounded-lg p-6">
        <div className="flex items-center justify-between mb-5 border-b border-divider-soft pb-4">
          <h3 className="font-body-strong text-lg font-semibold text-ink">
            Nhật ký hoạt động
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted-48 bg-surface-pearl border border-hairline px-3 py-1 rounded-full">
              {periodLabel}
            </span>
            <span className="text-xs text-ink-muted-48">{activities.length} sự kiện</span>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-surface-pearl flex items-center justify-center">
              <Activity className="h-6 w-6 text-ink-muted-48" />
            </div>
            <p className="text-sm text-ink-muted-80 font-medium">Không có hoạt động nào trong khoảng thời gian này</p>
            <p className="text-xs text-ink-muted-48">Thử chọn khoảng thời gian khác</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {activities.map((act, idx) => {
              const cfg = typeConfig[act.type];
              return (
                <div
                  key={act.id}
                  className="flex gap-4 pb-4 pt-4 border-b border-divider-soft last:border-0 first:pt-0"
                >
                  <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    {idx < activities.length - 1 && (
                      <div className="w-px flex-1 bg-divider-soft mt-2" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                      <p className="text-sm font-semibold text-ink leading-snug">{act.title}</p>
                      <span className="text-[11px] text-ink-muted-48 flex-shrink-0">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted-80 truncate">{act.actor}</p>
                    <p className="text-[10px] text-ink-muted-48">{formatDateTime(act.timestamp)}</p>
                    <span className={`self-start mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
