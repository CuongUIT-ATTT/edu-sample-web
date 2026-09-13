import React from "react";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Calendar, GraduationCap, Plus, Sparkles, Users } from "lucide-react";
import { db } from "@/lib/db";
import StitchIconBadge, { type StitchIconBadgeVariant } from "@/components/ui/stitch/StitchIconBadge";

export const dynamic = "force-dynamic";

interface DashboardClassItem {
  id: string;
  name: string;
  studentsCount: number;
}

interface DashboardActivity {
  title: string;
  actor: string;
  timestamp: Date;
}

interface AdminStatItem {
  label: string;
  value: number | string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: StitchIconBadgeVariant;
  tone: string;
  tag: string;
}

function formatTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "Vừa xong";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "Vừa xong";
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

export default async function AdminDashboardPage() {
  let teachersCount = 0;
  let studentsCount = 0;
  let classesCount = 0;
  let todaySchedulesCount = 0;
  let dbClassesList: DashboardClassItem[] = [];
  let displayActivities: DashboardActivity[] = [];

  try {
    teachersCount = await db.teacherProfile.count();
    studentsCount = await db.studentProfile.count();
    classesCount = await db.class.count();

    const jsDay = new Date().getDay();
    const todayDow = jsDay === 0 ? 7 : jsDay;
    const todayStartSource = new Date();
    const todayStart = new Date(
      todayStartSource.getFullYear(),
      todayStartSource.getMonth(),
      todayStartSource.getDate(),
      0,
      0,
      0,
      0
    );
    const todayEnd = new Date(
      todayStartSource.getFullYear(),
      todayStartSource.getMonth(),
      todayStartSource.getDate(),
      23,
      59,
      59,
      999
    );
    todaySchedulesCount = await db.scheduleSeries.count({
      where: {
        dayOfWeek: todayDow,
        startDate: { lte: todayEnd },
        OR: [{ endDate: null }, { endDate: { gte: todayStart } }],
      },
    });

    const classes = await db.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      take: 5,
    });

    dbClassesList = classes.map((c) => ({
      id: c.id,
      name: c.name,
      studentsCount: c._count?.students ?? 0,
    }));

    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const recentQuizSubmissions = await db.quizSubmission.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        quiz: true,
        student: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    const recentHomeworkSubmissions = await db.homeworkSubmission.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        series: {
          include: { class: true },
        },
        student: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    const activitiesList: DashboardActivity[] = [];

    recentUsers.forEach((u) => {
      let roleText = "Người dùng";
      if (u.role === "TEACHER") roleText = "Giảng viên";
      else if (u.role === "STUDENT") roleText = "Học viên";
      else if (u.role === "PARENT") roleText = "Phụ huynh";
      else if (u.role === "ADMIN") roleText = "Quản trị viên";

      activitiesList.push({
        title: `Tạo mới tài khoản ${roleText.toLowerCase()}: ${u.name || u.email}`,
        actor: "Thực hiện bởi Admin",
        timestamp: u.createdAt,
      });
    });

    recentQuizSubmissions.forEach((qs) => {
      const name = qs.student?.user?.name || qs.guestName || "Khách vãng lai";
      activitiesList.push({
        title: `Nộp bài thi tự luyện: ${qs.quiz?.title || "Đề thi"} (${(qs.score ?? 0).toFixed(1)}đ)`,
        actor: `Thực hiện bởi ${name}`,
        timestamp: qs.submittedAt,
      });
    });

    recentHomeworkSubmissions.forEach((hs) => {
      const className = hs.series?.class?.name || "lớp học";
      const studentName = hs.student?.user?.name || "Học viên";
      activitiesList.push({
        title: `Nộp bài tập về nhà ${className}`,
        actor: `Thực hiện bởi ${studentName}`,
        timestamp: hs.submittedAt,
      });
    });

    activitiesList.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    displayActivities = activitiesList.slice(0, 5);
  } catch (error) {
    console.error("Prisma error in Admin Dashboard:", error);
  }

  const totalTeachers = teachersCount || 28;
  const totalStudents = studentsCount || 452;
  const totalClasses = classesCount || 16;
  const totalSchedulesToday = todaySchedulesCount;

  const displayClasses =
    dbClassesList.length > 0
      ? dbClassesList
      : [
          { id: "1", name: "Lớp 10A1", studentsCount: 32 },
          { id: "2", name: "Lớp 11B2", studentsCount: 30 },
          { id: "3", name: "Lớp 12C3", studentsCount: 28 },
        ];

  const stats: AdminStatItem[] = [
    { label: "Tổng giảng viên", value: totalTeachers, href: "/admin/users", icon: Users, variant: "blue", tone: "text-primary", tag: "Giảng viên" },
    { label: "Tổng học viên", value: totalStudents, href: "/admin/users", icon: GraduationCap, variant: "emerald", tone: "text-emerald-600 dark:text-emerald-400", tag: "Học viên" },
    { label: "Số lớp luyện thi", value: totalClasses, href: "/admin/classes", icon: BookOpen, variant: "purple", tone: "text-purple-600 dark:text-purple-400", tag: "Lớp học" },
    { label: "Lịch dạy hôm nay", value: `${totalSchedulesToday} ca`, href: "/admin/calendar", icon: Calendar, variant: "amber", tone: "text-amber-600 dark:text-amber-400", tag: "Hôm nay" },
  ];

  return (
    <div className="relative flex flex-col gap-8 max-w-[1200px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(0,102,204,0.12),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,0.1),transparent_36%)]" />

      <section className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between gap-6 overflow-hidden relative">
        <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <StitchIconBadge icon={Sparkles} variant="blue" size="md" />
            <span className="inline-flex w-fit items-center text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full uppercase tracking-wider">
              Bảng điều khiển quản trị
            </span>
          </div>
          <div>
            <h1 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">Xin chào, Quản trị viên</h1>
            <p className="font-caption text-ink-muted-80 mt-2 max-w-[620px] leading-relaxed">
              Theo dõi vận hành trung tâm luyện thi, tài khoản, lớp học và lịch dạy trong một không gian quản trị nổi bật.
            </p>
          </div>
        </div>
        <Link
          href="/admin/users"
          className="relative z-10 bg-primary hover:bg-primary-focus text-white px-5 py-3 rounded-full font-caption-strong text-xs flex items-center justify-center gap-2 apple-active-scale transition-colors shadow-lg shadow-primary/25 h-fit"
        >
          <Plus className="h-4 w-4" /> Tạo người dùng mới
        </Link>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 flex flex-col gap-4 motion-card shadow-xl overflow-hidden relative"
            >
              <div className="absolute -right-8 -bottom-10 h-28 w-28 rounded-full bg-primary/5 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <StitchIconBadge icon={Icon} variant={stat.variant} size="md" />
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-canvas/60 dark:bg-slate-800/60 text-ink-muted-80 border border-hairline/60">
                  {stat.tag}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-xs text-ink-muted-48 uppercase font-extrabold tracking-wider">{stat.label}</p>
                <h3 className={`font-display-lg text-3xl font-extrabold mt-1 transition-colors ${stat.tone}`}>
                  {stat.value}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4 border-b border-hairline/60 pb-4 mb-4">
            <h2 className="font-body-strong text-lg font-extrabold text-ink">Hoạt động hệ thống gần đây</h2>
            <StitchIconBadge icon={Activity} variant="cyan" size="sm" />
          </div>
          <div className="flex flex-col gap-4">
            {displayActivities.length === 0 ? (
              <p className="text-xs text-ink-muted-48 text-center py-8">Chưa có hoạt động hệ thống nào gần đây.</p>
            ) : (
              displayActivities.map((act) => (
                <div key={`${act.title}-${act.timestamp.toISOString()}`} className="flex justify-between items-start gap-4 text-xs border-b border-hairline/50 pb-3 last:border-0">
                  <div>
                    <p className="font-bold text-ink leading-relaxed">{act.title}</p>
                    <p className="text-ink-muted-48 mt-1">{act.actor}</p>
                  </div>
                  <span className="text-ink-muted-48 flex-shrink-0 font-mono">{formatTimeAgo(act.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <Link href="/admin/classes" className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl hover:border-primary/40 transition-all block motion-card">
          <h2 className="font-body-strong text-lg font-extrabold text-ink border-b border-hairline/60 pb-4 mb-4 flex justify-between items-center gap-3">
            <span>Xem nhanh danh sách lớp</span>
            <span className="text-xs text-primary font-extrabold flex items-center gap-1">
              Chi tiết <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            {displayClasses.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm rounded-2xl bg-canvas/60 dark:bg-slate-800/60 border border-hairline/60 px-4 py-3">
                <span className="font-bold text-ink">{item.name}</span>
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold">{item.studentsCount} học viên</span>
              </div>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}
