import React from "react";
import Link from "next/link";
import { ArrowRight, Award, Calendar, CheckSquare, Sparkles, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dateToUtcStr, expandSeriesToInstances, normalizeDateUtc } from "@/lib/schedule-expand";
import StitchIconBadge, { type StitchIconBadgeVariant } from "@/components/ui/stitch/StitchIconBadge";

export const dynamic = "force-dynamic";

interface StudentScheduleItem {
  id: string;
  time: string;
  subjectName: string;
  teacherName: string;
  room: string;
  status: string;
}

interface StudentStatItem {
  label: string;
  value: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: StitchIconBadgeVariant;
}

export default async function StudentDashboardPage() {
  const session = await getSession();

  let studentName = "Học viên";
  let className = "Chưa xếp lớp";
  let gpaString = "—";
  let attendanceRate = "—";
  let subjectsCount = 0;
  let rankingTitle = "";
  let schedulesList: StudentScheduleItem[] = [];

  try {
    if (session) {
      studentName = session.name;

      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          classes: true,
          grades: true,
          attendances: true,
        },
      });

      if (studentProfile) {
        className = studentProfile.classes.map((c) => c.name).join(", ") || "Chưa xếp lớp";

        const grades = studentProfile.grades;
        if (grades.length > 0) {
          const sum = grades.reduce((acc, g) => acc + g.score, 0);
          const avgScoreVal = sum / grades.length;
          gpaString = `${avgScoreVal.toFixed(1)} / 10`;

          if (avgScoreVal >= 9.0) rankingTitle = "Huyền Thoại Luyện Đề 🏆";
          else if (avgScoreVal >= 8.0) rankingTitle = "Thần Phản Ứng Luyện Thi ⚡";
          else rankingTitle = "Chiến Binh Chuyên Đề 🔥";
        }

        const attendances = studentProfile.attendances;
        if (attendances.length > 0) {
          const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
          attendanceRate = `${((presentCount / attendances.length) * 100).toFixed(1)}%`;
        }

        const classIds = studentProfile.classes.map((c) => c.id);
        if (classIds.length > 0) {
          const distinctSubjects = await db.scheduleSeries.findMany({
            where: { classId: { in: classIds } },
            select: { subjectId: true },
            distinct: ["subjectId"],
          });
          subjectsCount = distinctSubjects.length;

          const seriesList = await db.scheduleSeries.findMany({
            where: { classId: { in: classIds } },
            include: {
              subject: true,
              teacher: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
              exceptions: true,
            },
            orderBy: { startTime: "asc" },
          });

          const today = normalizeDateUtc(new Date());
          const tomorrow = normalizeDateUtc(new Date(today.getTime() + 24 * 60 * 60 * 1000));
          const todayStr = dateToUtcStr(today);
          const tomorrowStr = dateToUtcStr(tomorrow);
          const todayTomorrowItems: StudentScheduleItem[] = [];

          for (const series of seriesList) {
            const instances = expandSeriesToInstances(series, series.exceptions, today, tomorrow);
            for (const inst of instances) {
              const instDateStr = dateToUtcStr(inst.instanceDate);
              const dayLabel = instDateStr === todayStr ? "Hôm nay" : "Ngày mai";
              todayTomorrowItems.push({
                id: `${inst.seriesId}-${instDateStr}`,
                time: `${dayLabel}, ${inst.startTime} - ${inst.endTime}`,
                subjectName: series.subject?.name || "Môn học",
                teacherName: series.teacher?.user?.name || "Giảng viên",
                room: inst.room || "Room 302",
                status: instDateStr === tomorrowStr ? "Sắp diễn ra" : "Hôm nay",
              });
            }
          }
          schedulesList = todayTomorrowItems;
        }
      }
    }
  } catch (error) {
    console.error("Prisma error in Student Dashboard:", error);
  }

  const displayGPA = gpaString;
  const displayAttendance = attendanceRate;
  const displaySubjectsCount = subjectsCount;
  const displaySchedules = schedulesList;
  const examDate = new Date("2027-06-25T07:30:00").getTime();
  const now = new Date().getTime();
  const diffMs = examDate - now;
  const daysRemaining = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

  const stats: StudentStatItem[] = [
    { label: "Điểm trung bình", value: displayGPA, href: "/student/grades", icon: Award, variant: "blue" },
    { label: "Tỷ lệ chuyên cần", value: displayAttendance, href: "/student/attendance", icon: CheckSquare, variant: "emerald" },
    { label: "Chuyên đề ôn luyện", value: `${displaySubjectsCount} khóa`, href: "/student/calendar", icon: Calendar, variant: "purple" },
  ];

  return (
    <div className="relative flex flex-col gap-8 max-w-[1200px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(0,102,204,0.13),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(34,197,94,0.1),transparent_34%)]" />

      <section className="backdrop-blur-2xl bg-gradient-to-r from-blue-950/95 via-indigo-950/95 to-slate-950/95 border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 overflow-hidden relative">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/10 text-amber-300 border border-white/15 flex items-center justify-center shadow-inner">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-tagline text-base font-extrabold">Kỳ thi Tốt nghiệp THPT Quốc Gia 2027</h2>
            <p className="text-xs text-indigo-100 mt-1 max-w-[540px]">Đặc trị lỗi sai lý thuyết và bứt phá điểm số cùng EduWeb.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-2 items-center bg-white/10 border border-white/15 rounded-full px-4 py-2 backdrop-blur-lg">
          <span className="text-xs text-indigo-100 font-bold">Chỉ còn</span>
          <span className="font-mono text-2xl font-extrabold text-amber-300">{daysRemaining}</span>
          <span className="text-xs text-indigo-100">ngày thi</span>
        </div>
      </section>

      <section className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-4">
        <div className="flex flex-wrap justify-between gap-4 items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <StitchIconBadge icon={Sparkles} variant="blue" size="md" />
              <span className="inline-flex text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full uppercase tracking-wider">Không gian học viên</span>
            </div>
            <h1 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">Xin chào, {studentName}</h1>
            <p className="font-caption text-ink-muted-80 mt-2">Lớp {className} • Học viên trung tâm.</p>
          </div>
          {rankingTitle && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span>Học vị:</span>
              <strong>{rankingTitle}</strong>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="group backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 flex flex-col gap-4 shadow-xl motion-card">
              <StitchIconBadge icon={Icon} variant={stat.variant} size="md" />
              <div>
                <p className="text-xs text-ink-muted-48 uppercase font-extrabold tracking-wider">{stat.label}</p>
                <h3 className="font-display-lg text-3xl font-extrabold text-ink mt-1 group-hover:text-primary transition-colors">{stat.value}</h3>
              </div>
            </Link>
          );
        })}
      </div>

      <Link href="/student/calendar" className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl hover:border-primary/40 transition-all block motion-card">
        <h2 className="font-body-strong text-lg font-extrabold text-ink border-b border-hairline/60 pb-4 mb-4 flex justify-between items-center gap-3">
          <span>Lịch học hôm nay &amp; ngày mai</span>
          <span className="text-xs text-primary font-extrabold flex items-center gap-1">Chi tiết <ArrowRight className="h-3.5 w-3.5" /></span>
        </h2>
        <div className="flex flex-col gap-4">
          {displaySchedules.length === 0 && <p className="text-xs text-ink-muted-48 text-center py-8">Chưa có lịch học trong hôm nay và ngày mai.</p>}
          {displaySchedules.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm border-b border-hairline/50 pb-3 last:border-0">
              <div className="flex items-center gap-4">
                <span className="font-mono font-extrabold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs">{item.time}</span>
                <div>
                  <p className="font-bold text-ink">{item.subjectName}</p>
                  <p className="text-xs text-ink-muted-48">{item.teacherName} • {item.room}</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit">{item.status}</span>
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
