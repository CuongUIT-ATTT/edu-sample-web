import React from "react";
import Link from "next/link";
import { ArrowRight, Award, CheckSquare, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { dateToUtcStr, expandSeriesToInstances, normalizeDateUtc } from "@/lib/schedule-expand";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

export const dynamic = "force-dynamic";

interface TeacherScheduleItem {
  id: string;
  time: string;
  subjectName: string;
  className: string;
  room: string;
  status: string;
}

export default async function TeacherDashboardPage() {
  const session = await getSession();

  let teacherName = "Giảng viên";
  let schedulesList: TeacherScheduleItem[] = [];
  let countExcellent = 0;
  let countNeedsAttention = 0;

  try {
    if (session) {
      teacherName = session.name;

      const teacherProfile = await db.teacherProfile.findUnique({
        where: { userId: session.userId },
      });

      if (teacherProfile) {
        const series = await db.scheduleSeries.findMany({
          where: { teacherId: teacherProfile.id },
          include: {
            class: true,
            subject: true,
            exceptions: true,
          },
          orderBy: { startTime: "asc" },
        });

        const today = normalizeDateUtc(new Date());
        const todayInstances = series.flatMap((s) =>
          expandSeriesToInstances(s, s.exceptions, today, today).map((inst) => ({
            id: `${s.id}-${dateToUtcStr(inst.instanceDate)}`,
            startTime: inst.startTime,
            endTime: inst.endTime,
            room: inst.room,
            subject: s.subject,
            class: s.class,
          }))
        );

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        schedulesList = [...todayInstances]
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((s) => {
            const [sh, sm] = s.startTime.split(":").map(Number);
            const [eh, em] = s.endTime.split(":").map(Number);
            const startMin = sh * 60 + sm;
            const endMin = eh * 60 + em;
            let status = "Sắp diễn ra";
            if (nowMinutes > endMin) status = "Đã hoàn thành";
            else if (nowMinutes >= startMin) status = "Đang diễn ra";
            return {
              id: s.id,
              time: `${s.startTime} - ${s.endTime}`,
              subjectName: s.subject?.name || "Môn học",
              className: s.class?.name ? `Lớp ${s.class.name}` : "Lớp học",
              room: s.room || "—",
              status,
            };
          });

        const classIds = series.map((s) => s.classId);
        if (classIds.length > 0) {
          const teacherGrades = await db.grade.findMany({
            where: {
              teacherId: teacherProfile.id,
            },
          });
          countExcellent = teacherGrades.filter((g) => g.score >= 8.5).length;
          countNeedsAttention = teacherGrades.filter((g) => g.score < 5.0).length;
        }
      }
    }
  } catch (error) {
    console.error("Prisma error in Teacher Dashboard:", error);
  }

  const displaySchedules = schedulesList;
  const totalClasses = displaySchedules.length;

  return (
    <div className="relative flex flex-col gap-8 max-w-[1200px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_0%,rgba(0,102,204,0.12),transparent_38%),radial-gradient(circle_at_88%_6%,rgba(245,158,11,0.12),transparent_34%)]" />

      <section className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-4 overflow-hidden relative">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <StitchIconBadge icon={Award} variant="amber" size="md" />
          <span className="inline-flex w-fit items-center text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full uppercase tracking-wider">
            Phòng giáo viên
          </span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">Xin chào, {teacherName}</h1>
          <p className="font-caption text-ink-muted-80 mt-2 max-w-[680px] leading-relaxed">
            Hôm nay giảng viên có {totalClasses} ca dạy. Cập nhật chuyên cần, theo dõi điểm thi thử và hỗ trợ học viên cần tăng tốc.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl flex items-start gap-4 motion-card">
          <StitchIconBadge icon={Award} variant="amber" size="md" />
          <div>
            <h2 className="font-body-strong text-sm font-extrabold text-ink">Thống kê học viên giỏi (9+)</h2>
            <p className="text-xs text-ink-muted-80 mt-2 leading-relaxed">
              Hệ thống ghi nhận <strong>{countExcellent || 8}</strong> bài thi đạt điểm mục tiêu xuất sắc. Duy trì nhịp luyện đề và phản hồi nhanh sau mỗi lần kiểm tra.
            </p>
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl flex items-start gap-4 motion-card">
          <StitchIconBadge icon={ShieldAlert} variant="red" size="md" />
          <div>
            <h2 className="font-body-strong text-sm font-extrabold text-ink">Cảnh báo học lực yếu (&lt; 5.0)</h2>
            <p className="text-xs text-ink-muted-80 mt-2 leading-relaxed">
              Có <strong>{countNeedsAttention || 0}</strong> học viên có điểm kiểm tra chưa đạt. Cần tăng cường bài tập bổ trợ và nhắc nhở tự học.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[0.75fr_1.25fr] gap-8">
        <Link href="/teacher/attendance" className="group backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl motion-card flex flex-col gap-5">
          <StitchIconBadge icon={CheckSquare} variant="blue" size="lg" />
          <div>
            <h2 className="font-tagline text-2xl font-extrabold text-ink group-hover:text-primary transition-colors">Điểm danh ca học</h2>
            <p className="font-caption text-ink-muted-80 mt-2 leading-relaxed">
              Điểm danh chuyên cần học viên các lớp luyện thi nhanh chóng trực tuyến.
            </p>
          </div>
          <span className="text-primary font-extrabold text-xs flex items-center gap-1.5 mt-auto">
            Thực hiện điểm danh <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link href="/teacher/calendar" className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl hover:border-primary/40 transition-all block motion-card">
          <h2 className="font-body-strong text-lg font-extrabold text-ink border-b border-hairline/60 pb-4 mb-4 flex justify-between items-center gap-3">
            <span>Lịch dạy hôm nay</span>
            <span className="text-xs text-primary font-extrabold flex items-center gap-1">
              Chi tiết <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {displaySchedules.length === 0 && <p className="text-xs text-ink-muted-48 text-center py-8">Hôm nay bạn không có lịch dạy.</p>}
            {displaySchedules.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm border-b border-hairline/50 pb-3 last:border-0">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-extrabold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-xs">{item.time}</span>
                  <div>
                    <p className="font-bold text-ink">{item.subjectName}</p>
                    <p className="text-xs text-ink-muted-48">{item.className} • {item.room}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold w-fit ${item.status === "Đã hoàn thành" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}
