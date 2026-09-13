import React from "react";
import Link from "next/link";
import { ArrowRight, Award, CheckSquare, Sparkles, Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import StitchIconBadge, { type StitchIconBadgeVariant } from "@/components/ui/stitch/StitchIconBadge";

export const dynamic = "force-dynamic";

interface GradeSummaryItem {
  id: string;
  subjectName: string;
  type: string;
  score: number;
  dateString: string;
}

interface AttendanceSummaryItem {
  id: string;
  dateString: string;
  status: string;
}

interface ParentStatItem {
  label: string;
  value: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: StitchIconBadgeVariant;
  helper?: string;
}

export default async function ParentDashboardPage() {
  const session = await getSession();

  let parentName = "Phụ huynh";
  let childName = "Con học viên";
  let className = "Lớp VIP";
  let gpaString = "8.6 / 10";
  let attendanceRate = "98.2%";
  let formTeacherName = "Thầy Nguyễn Văn Bình";
  let formTeacherPhone = "1900 1234";
  let rankingTitle = "Thần Phản Ứng Luyện Thi ⚡";
  let dbGrades: GradeSummaryItem[] = [];
  let dbAttendances: AttendanceSummaryItem[] = [];

  try {
    if (session) {
      parentName = session.name;

      const parentProfile = await db.parentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          students: {
            include: {
              user: {
                select: { name: true },
              },
              classes: {
                include: {
                  formTeacher: {
                    include: {
                      user: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
              grades: {
                include: { subject: true },
                orderBy: { date: "desc" },
              },
              attendances: {
                orderBy: { date: "desc" },
              },
            },
          },
        },
      });

      if (parentProfile && parentProfile.students.length > 0) {
        const student = parentProfile.students[0];
        childName = student.user?.name || "Con học viên";
        className = student.classes.map((c) => c.name).join(", ") || "Chưa xếp lớp";

        const primaryClass = student.classes[0];
        if (primaryClass?.formTeacher) {
          formTeacherName = primaryClass.formTeacher.user?.name || "Thầy cô bộ môn";
          formTeacherPhone = "1900 1234";
        }

        let avgScoreVal = 8.6;
        if (student.grades.length > 0) {
          const sum = student.grades.reduce((acc, g) => acc + g.score, 0);
          avgScoreVal = sum / student.grades.length;
          gpaString = `${avgScoreVal.toFixed(1)} / 10`;

          dbGrades = student.grades.slice(0, 3).map((g) => ({
            id: g.id,
            subjectName: g.subject?.name || "Môn học",
            type: g.type === "QUIZ" ? "Kiểm tra 15 phút" : g.type === "MIDTERM" ? "Thi thử Giữa kỳ" : "Kiểm tra miệng",
            score: g.score,
            dateString: new Date(g.date).toLocaleDateString("vi-VN"),
          }));
        }

        if (avgScoreVal >= 9.0) rankingTitle = "Huyền Thoại Luyện Đề 🏆";
        else if (avgScoreVal >= 8.0) rankingTitle = "Thần Phản Ứng Luyện Thi ⚡";
        else rankingTitle = "Chiến Binh Chuyên Đề 🔥";

        if (student.attendances.length > 0) {
          const presentCount = student.attendances.filter((a) => a.status === "PRESENT").length;
          attendanceRate = `${((presentCount / student.attendances.length) * 100).toFixed(1)}%`;

          dbAttendances = student.attendances.slice(0, 5).map((a) => ({
            id: a.id,
            dateString: new Date(a.date).toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "numeric",
              day: "numeric",
            }),
            status: a.status === "PRESENT" ? "Có mặt" : "Vắng mặt có phép",
          }));
        }
      }
    }
  } catch (error) {
    console.error("Prisma error in Parent Dashboard:", error);
  }

  const displayGrades =
    dbGrades.length > 0
      ? dbGrades
      : [
          { id: "1", subjectName: "Toán học nâng cao", type: "Kiểm tra 15 phút", score: 9.0, dateString: "08/07/2026" },
          { id: "2", subjectName: "Vật lý lý thuyết", type: "Kiểm tra miệng", score: 8.0, dateString: "06/07/2026" },
          { id: "3", subjectName: "Tiếng Anh học thuật", type: "Bài viết số 1", score: 8.5, dateString: "04/07/2026" },
        ];

  const displayAttendances =
    dbAttendances.length > 0
      ? dbAttendances
      : [
          { id: "1", dateString: "Thứ Tư, 08/07/2026", status: "Có mặt" },
          { id: "2", dateString: "Thứ Ba, 07/07/2026", status: "Có mặt" },
          { id: "3", dateString: "Thứ Hai, 06/07/2026", status: "Có mặt" },
          { id: "4", dateString: "Thứ Sáu, 03/07/2026", status: "Vắng mặt có phép" },
          { id: "5", dateString: "Thứ Năm, 02/07/2026", status: "Có mặt" },
        ];

  const examDate = new Date("2027-06-25T07:30:00").getTime();
  const now = new Date().getTime();
  const diffMs = examDate - now;
  const daysRemaining = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

  const stats: ParentStatItem[] = [
    { label: "Điểm thi thử của con", value: gpaString, href: "/parent/grades", icon: Award, variant: "blue" },
    { label: "Tỷ lệ chuyên cần", value: attendanceRate, href: "/parent/attendance", icon: CheckSquare, variant: "emerald" },
    { label: "Giảng viên phụ trách", value: formTeacherName, href: "/parent/children", icon: Users, variant: "purple", helper: `Hotline: ${formTeacherPhone}` },
  ];

  return (
    <div className="relative flex flex-col gap-8 max-w-[1200px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(0,102,204,0.12),transparent_38%),radial-gradient(circle_at_88%_8%,rgba(245,158,11,0.12),transparent_34%)]" />

      <section className="backdrop-blur-2xl bg-gradient-to-r from-blue-950/95 via-indigo-950/95 to-slate-950/95 border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 overflow-hidden relative">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/10 text-amber-300 border border-white/15 flex items-center justify-center shadow-inner">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-tagline text-base font-extrabold">Kỳ thi Tốt nghiệp THPT 2027 của con đang cận kề</h2>
            <p className="text-xs text-indigo-100 mt-1 max-w-[560px]">Đồng hành cùng con ôn tập, khắc phục lỗi sai lý thuyết và duy trì động lực học tập.</p>
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
              <StitchIconBadge icon={Sparkles} variant="amber" size="md" />
              <span className="inline-flex text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full uppercase tracking-wider">Không gian phụ huynh</span>
            </div>
            <h1 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">Xin chào, {parentName}</h1>
            <p className="font-caption text-ink-muted-80 mt-2">Phụ huynh học viên: <strong>{childName}</strong> (Lớp {className}).</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <span>Danh hiệu của con:</span>
            <strong>{rankingTitle}</strong>
          </div>
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
                <h3 className="font-display-lg text-2xl font-extrabold text-ink mt-1 group-hover:text-primary transition-colors">{stat.value}</h3>
                {stat.helper && <p className="text-xs text-ink-muted-48 mt-1">{stat.helper}</p>}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href="/parent/grades" className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl hover:border-primary/40 transition-all block motion-card">
          <h2 className="font-body-strong text-lg font-extrabold text-ink border-b border-hairline/60 pb-4 mb-4 flex justify-between items-center gap-3">
            <span>Kết quả kiểm tra mới nhận</span>
            <span className="text-xs text-primary font-extrabold flex items-center gap-1">Xem tất cả <ArrowRight className="h-3.5 w-3.5" /></span>
          </h2>
          <div className="flex flex-col gap-4">
            {displayGrades.map((grade) => (
              <div key={grade.id} className="flex justify-between items-center text-sm border-b border-hairline/50 pb-3 last:border-0">
                <div>
                  <p className="font-bold text-ink">{grade.subjectName}</p>
                  <p className="text-xs text-ink-muted-48">{grade.type}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-primary text-base">{grade.score}</span>
                  <p className="text-[10px] text-ink-muted-48">{grade.dateString}</p>
                </div>
              </div>
            ))}
          </div>
        </Link>

        <Link href="/parent/attendance" className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl hover:border-emerald-500/40 transition-all block motion-card">
          <h2 className="font-body-strong text-lg font-extrabold text-ink border-b border-hairline/60 pb-4 mb-4 flex justify-between items-center gap-3">
            <span>Nhật ký điểm danh gần đây</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">Chi tiết <ArrowRight className="h-3.5 w-3.5" /></span>
          </h2>
          <div className="flex flex-col gap-3">
            {displayAttendances.map((att) => (
              <div key={att.id} className="flex justify-between items-center gap-3 text-sm rounded-2xl bg-canvas/60 dark:bg-slate-800/60 border border-hairline/60 px-4 py-3">
                <span className="text-ink font-semibold">{att.dateString}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${att.status.includes("Có mặt") ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"}`}>
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}
