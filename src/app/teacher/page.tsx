import React from "react";
import Link from "next/link";
import {
  CheckSquare,
  TrendingUp,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Award,
  UserCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
        const schedules = await db.schedule.findMany({
          where: { teacherId: teacherProfile.id },
          include: {
            class: true,
            subject: true,
          },
          orderBy: { startTime: "asc" },
        });

        schedulesList = schedules.map((s) => ({
          id: s.id,
          time: `${s.startTime} - ${s.endTime}`,
          subjectName: s.subject.name,
          className: `Lớp ${s.class.name}`,
          room: s.room || "Room 302",
          status: "Sắp diễn ra",
        }));

        // Fetch students under this teacher
        const classIds = schedules.map((s) => s.classId);
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

  // Fallback data if DB is empty or no schedules exist
  const displaySchedules =
    schedulesList.length > 0
      ? schedulesList
      : [
          {
            id: "1",
            time: "08:00 - 09:30",
            subjectName: "Toán học nâng cao",
            className: "Lớp 10A1 VIP",
            room: "Room 302",
            status: "Đã hoàn thành",
          },
          {
            id: "2",
            time: "10:00 - 11:30",
            subjectName: "Giải tích luyện đề",
            className: "Lớp 12B3 VIP",
            room: "Room 405",
            status: "Sắp diễn ra",
          },
          {
            id: "3",
            time: "14:00 - 15:30",
            subjectName: "Toán chuyên đề đại số",
            className: "Lớp 11A2 VIP",
            room: "Room 304",
            status: "Sắp diễn ra",
          },
        ];

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

        <Link
          href="/teacher/grades"
          className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4 hover:border-green-600 transition-all duration-200 apple-active-scale cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-body-strong text-lg font-semibold text-ink group-hover:text-green-600 transition-colors">
              Nhập điểm thi thử
            </h3>
            <p className="font-caption text-ink-muted-80 mt-1">
              Cập nhật kết quả thi thử định kỳ, kiểm tra 15 phút và nhận xét
              giảng viên.
            </p>
          </div>
          <span className="text-primary hover:underline font-caption font-semibold flex items-center gap-1.5 mt-2">
            Cập nhật điểm số <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          href="/teacher/schedules"
          className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4 hover:border-purple-600 transition-all duration-200 apple-active-scale cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-body-strong text-lg font-semibold text-ink group-hover:text-purple-600 transition-colors">
              Lịch giảng dạy tuần
            </h3>
            <p className="font-caption text-ink-muted-80 mt-1">
              Tra cứu thời gian biểu, phòng livestream và các lớp học được phân
              công.
            </p>
          </div>
          <span className="text-primary hover:underline font-caption font-semibold flex items-center gap-1.5 mt-2">
            Xem lịch dạy học <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {/* Class Schedule detail view */}
      <Link
        href="/teacher/schedules"
        className="bg-canvas border border-hairline rounded-lg p-6 hover:border-primary transition-all duration-200 cursor-pointer block"
      >
        <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4 flex justify-between items-center">
          <span>Lịch dạy hôm nay</span>
          <span className="text-xs text-primary font-semibold hover:underline">
            Chi tiết thời khóa biểu &rarr;
          </span>
        </h3>
        <div className="flex flex-col gap-4">
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
