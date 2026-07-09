import React from "react";
import Link from "next/link";
import { CheckSquare, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function TeacherDashboardPage() {
  const session = await getSession();
  
  let teacherName = "Thầy/Cô";
  let schedulesList: {
    id: string;
    time: string;
    subjectName: string;
    className: string;
    room: string;
    status: string;
  }[] = [];

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
          className: s.class.name,
          room: s.room || "Chưa xếp phòng",
          status: "Sắp diễn ra", // Mock state for display
        }));
      }
    }
  } catch (error) {
    console.error("Prisma error in Teacher Dashboard:", error);
  }

  // Fallback data if DB is empty or no schedules exist
  const displaySchedules = schedulesList.length > 0 
    ? schedulesList 
    : [
        { id: "1", time: "08:00 - 09:30", subjectName: "Toán học nâng cao", className: "Lớp 10A1", room: "Phòng 302", status: "Đã hoàn thành" },
        { id: "2", time: "10:00 - 11:30", subjectName: "Giải tích học phần 1", className: "Lớp 12B3", room: "Phòng 405", status: "Sắp diễn ra" },
        { id: "3", time: "14:00 - 15:30", subjectName: "Toán đại số cơ bản", className: "Lớp 11A2", room: "Phòng 304", status: "Sắp diễn ra" },
      ];

  const totalClasses = displaySchedules.length;

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      
      {/* Welcome Block */}
      <div>
        <h1 className="font-display-lg text-3xl font-semibold text-ink">Xin chào, {teacherName}</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Hôm nay Thầy/Cô có {totalClasses} tiết dạy. Hãy theo dõi và cập nhật tiến độ học tập lớp học.</p>
      </div>

      {/* Grid of main teacher actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-sm bg-blue-50 text-primary flex items-center justify-center">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-body-strong text-lg font-semibold text-ink">Điểm danh hôm nay</h3>
            <p className="font-caption text-ink-muted-80 mt-1">Điểm danh chuyên cần học sinh các lớp nhanh chóng trực tuyến.</p>
          </div>
          <Link href="/teacher/attendance" className="text-primary hover:underline font-caption font-semibold flex items-center gap-1.5 mt-2">
            Thực hiện điểm danh <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-body-strong text-lg font-semibold text-ink">Sổ điểm môn học</h3>
            <p className="font-caption text-ink-muted-80 mt-1">Cập nhật điểm kiểm tra miệng, 15 phút, giữa kỳ và cuối kỳ.</p>
          </div>
          <Link href="/teacher/grades" className="text-primary hover:underline font-caption font-semibold flex items-center gap-1.5 mt-2">
            Cập nhật điểm số <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-body-strong text-lg font-semibold text-ink">Lịch dạy học tuần</h3>
            <p className="font-caption text-ink-muted-80 mt-1">Tra cứu thời gian biểu, phòng học và lớp giảng dạy được phân công.</p>
          </div>
          <Link href="/teacher/schedules" className="text-primary hover:underline font-caption font-semibold flex items-center gap-1.5 mt-2">
            Xem thời khóa biểu <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Class Schedule detail view */}
      <div className="bg-canvas border border-hairline rounded-lg p-6">
        <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4">
          Lịch giảng dạy hôm nay
        </h3>
        <div className="flex flex-col gap-4">
          {displaySchedules.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
              <div className="flex items-center gap-4">
                <span className="font-bold text-primary w-24">{item.time}</span>
                <div>
                  <p className="font-semibold text-ink">{item.subjectName}</p>
                  <p className="text-xs text-ink-muted-48">{item.className} • {item.room}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                item.status === "Đã hoàn thành" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-orange-100 text-orange-800"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
