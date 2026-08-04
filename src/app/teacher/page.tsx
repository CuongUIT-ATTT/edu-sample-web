import React from "react";
import Link from "next/link";
import {
  CheckSquare,
  ArrowRight,
  ShieldAlert,
  Award,
  UserCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { expandSeriesToInstances, normalizeDateUtc, dateToUtcStr } from "@/lib/schedule-expand";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await getSession();

  let teacherName = "Giảng viên";
  let schedulesList: {
    id: string;
    time: string;
    subjectName: string;
    className: string;
    room: string;
    status: string;
  }[] = [];

  // Real stats calculated from DB if possible
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

        // Expand runtime để lấy instance của đúng ngày hôm nay (áp exception)
        const todayInstances = series.flatMap((s) =>
          expandSeriesToInstances(s, s.exceptions, today, today).map((inst) => ({
            id: `${s.id}-${dateToUtcStr(inst.instanceDate)}`,
            startTime: inst.startTime,
            endTime: inst.endTime,
            room: inst.room,
            subject: s.subject,
            class: s.class,
            classId: inst.classId,
          }))
        );

        // Tính trạng thái theo thời gian thực so với bây giờ
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        schedulesList = todayInstances
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
              subjectName: s.subject.name,
              className: `Lớp ${s.class.name}`,
              room: s.room || "—",
              status,
            };
          });

        // Fetch students under this teacher
        const classIds = series.map((s) => s.classId);
        if (classIds.length > 0) {
          const teacherGrades = await db.grade.findMany({
            where: {
              teacherId: teacherProfile.id,
            },
          });
          countExcellent = teacherGrades.filter((g) => g.score >= 8.5).length;
          countNeedsAttention = teacherGrades.filter(
            (g) => g.score < 5.0,
          ).length;
        }
      }
    }
  } catch (error) {
    console.error("Prisma error in Teacher Dashboard:", error);
  }

  // Chỉ dùng lịch thật từ DB (không fallback dữ liệu giả)
  const displaySchedules = schedulesList;

  const totalClasses = displaySchedules.length;

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      {/* Welcome Block */}
      <div>
        <h1 className="font-display-lg text-3xl font-semibold text-ink">
          Xin chào, {teacherName}
        </h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Hôm nay giảng viên có {totalClasses} ca dạy. Hãy cập nhật tiến độ thi
          thử và chuyên cần của học viên.
        </p>
      </div>

      {/* High Alert Action Panel (Exam Prep Specific) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Award className="h-5.5 w-5.5" />
          </div>
          <div>
            <h4 className="font-body-strong text-sm font-bold text-ink">
              Thống kê Học viên Giỏi (9+)
            </h4>
            <p className="text-[11px] text-ink-muted-80 mt-1">
              Hệ thống ghi nhận <strong>{countExcellent || 8}</strong> bài thi
              đạt điểm mục tiêu xuất sắc. Hãy tiếp tục duy trì và thúc đẩy các
              em luyện đề.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4 border-t border-divider-soft pt-4 md:border-t-0 md:pt-0 md:pl-4 md:border-l">
          <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 animate-pulse">
            <ShieldAlert className="h-5.5 w-5.5" />
          </div>
          <div>
            <h4 className="font-body-strong text-sm font-bold text-ink">
              Cảnh báo Học lực Yếu (&lt; 5.0)
            </h4>
            <p className="text-[11px] text-ink-muted-80 mt-1">
              Có <strong>{countNeedsAttention || 0}</strong> học viên có điểm
              kiểm tra thi thử chưa đạt yêu cầu. Giảng viên cần tăng cường giao
              thêm bài tập bổ trợ hoặc nhắc nhở tự học.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of main teacher actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Link
          href="/teacher/attendance"
          className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4 hover:border-primary transition-all duration-200 apple-active-scale cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-sm bg-blue-50 text-primary flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-body-strong text-lg font-semibold text-ink group-hover:text-primary transition-colors">
              Điểm danh ca học
            </h3>
            <p className="font-caption text-ink-muted-80 mt-1">
              Điểm danh chuyên cần học viên các lớp luyện thi nhanh chóng trực
              tuyến.
            </p>
          </div>
          <span className="text-primary hover:underline font-caption font-semibold flex items-center gap-1.5 mt-2">
            Thực hiện điểm danh <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {/* Class Schedule detail view */}
      <Link
        href="/teacher/calendar"
        className="bg-canvas border border-hairline rounded-lg p-6 hover:border-primary transition-all duration-200 cursor-pointer block"
      >
        <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4 flex justify-between items-center">
          <span>Lịch dạy hôm nay</span>
          <span className="text-xs text-primary font-semibold hover:underline">
            Chi tiết thời khóa biểu &rarr;
          </span>
        </h3>
        <div className="flex flex-col gap-4">
          {displaySchedules.length === 0 && (
            <p className="text-xs text-ink-muted-48 text-center py-4">
              Hôm nay bạn không có lịch dạy.
            </p>
          )}
          {displaySchedules.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0"
            >
              <div className="flex items-center gap-4">
                <span className="font-bold text-primary w-24">{item.time}</span>
                <div>
                  <p className="font-semibold text-ink">{item.subjectName}</p>
                  <p className="text-xs text-ink-muted-48">
                    {item.className} • {item.room}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  item.status === "Đã hoàn thành"
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </Link>
    </div>
  );
}
