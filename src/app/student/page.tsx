import React from "react";
import { Calendar, CheckSquare, Award, Clock, Trophy, HelpCircle } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";


export default async function StudentDashboardPage() {
  const session = await getSession();

  let studentName = "Học viên";
  let className = "Lớp VIP";
  let gpaString = "8.6 / 10";
  let attendanceRate = "98.2%";
  let subjectsCount = 8;
  let rankingTitle = "Thần Phản Ứng Luyện Thi ⚡";
  let schedulesList: {
    id: string;
    time: string;
    subjectName: string;
    teacherName: string;
    room: string;
    status: string;
  }[] = [];

  try {
    if (session) {
      studentName = session.name;
      
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
        include: {
          class: true,
          grades: true,
          attendances: true,
        },
      });

      if (studentProfile) {
        className = studentProfile.class?.name || "Chưa xếp lớp";
        
        // Calculate GPA
        const grades = studentProfile.grades;
        let avgScoreVal = 8.6;
        if (grades.length > 0) {
          const sum = grades.reduce((acc, g) => acc + g.score, 0);
          avgScoreVal = sum / grades.length;
          gpaString = `${avgScoreVal.toFixed(1)} / 10`;
        }

        // Set ranking title dynamically
        if (avgScoreVal >= 9.0) rankingTitle = "Huyền Thoại Luyện Đề 🏆";
        else if (avgScoreVal >= 8.0) rankingTitle = "Thần Phản Ứng Luyện Thi ⚡";
        else rankingTitle = "Chiến Binh Chuyên Đề 🔥";

        // Calculate Attendance Rate
        const attendances = studentProfile.attendances;
        if (attendances.length > 0) {
          const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
          attendanceRate = `${((presentCount / attendances.length) * 100).toFixed(1)}%`;
        }

        // Fetch subjects count in their class
        if (studentProfile.classId) {
          const distinctSubjects = await db.schedule.findMany({
            where: { classId: studentProfile.classId },
            select: { subjectId: true },
            distinct: ["subjectId"],
          });
          subjectsCount = distinctSubjects.length || 8;

          // Fetch schedules list
          const schedules = await db.schedule.findMany({
            where: { classId: studentProfile.classId },
            include: {
              subject: true,
              teacher: { include: { user: true } },
            },
            orderBy: { startTime: "asc" },
          });

          schedulesList = schedules.map((s) => ({
            id: s.id,
            time: `${s.startTime} - ${s.endTime}`,
            subjectName: s.subject.name,
            teacherName: s.teacher.user.name,
            room: s.room || "Room 302",
            status: "Có mặt", // Mock status mapping for display
          }));
        }
      }
    }
  } catch (error) {
    console.error("Prisma error in Student Dashboard:", error);
  }

  const displayGPA = gpaString;
  const displayAttendance = attendanceRate;
  const displaySubjectsCount = subjectsCount;

  const displaySchedules = schedulesList.length > 0 
    ? schedulesList 
    : [
        { id: "1", time: "08:00 - 09:30", subjectName: "Toán học nâng cao", teacherName: "Thầy Hùng Cường", room: "Room 302", status: "Đã điểm danh - Có mặt" },
        { id: "2", time: "10:00 - 11:30", subjectName: "Vật lý lý thuyết", teacherName: "Thầy Nguyễn Văn Bình", room: "Room 401", status: "Chưa bắt đầu" },
      ];

  // Calculate static countdown days on the server
  const examDate = new Date("2027-06-25T07:30:00").getTime();
  const now = new Date().getTime();
  const diffMs = examDate - now;
  const daysRemaining = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      
      {/* Top Countdown bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border border-indigo-950 rounded-lg p-5 text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-950 text-amber-400 flex items-center justify-center flex-shrink-0 animate-bounce">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-tagline text-sm font-bold">Kỳ thi Tốt nghiệp THPT Quốc Gia 2027</h4>
            <p className="text-[11px] text-indigo-200">Đặc trị các lỗi sai lý thuyết và bứt phá điểm số cùng Thầy Hùng Cường</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-indigo-200 font-semibold">Chỉ còn:</span>
          <span className="font-mono text-xl font-extrabold text-amber-300 bg-indigo-950 px-3.5 py-1 rounded border border-indigo-800">
            {daysRemaining}
          </span>
          <span className="text-xs text-indigo-200">ngày thi</span>
        </div>
      </div>

      {/* Welcome Block */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="font-display-lg text-3xl font-semibold text-ink">Xin chào, {studentName}</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Lớp {className} • Học viên trung tâm.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
          <span>Học vị:</span>
          <strong className="text-amber-900">{rankingTitle}</strong>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/student/grades" className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3 hover:border-primary transition-all duration-200 apple-active-scale cursor-pointer group">
          <div className="h-10 w-10 rounded-sm bg-blue-50 text-primary flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Điểm trung bình (GPA)</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1 group-hover:text-primary transition-colors">{displayGPA}</h3>
          </div>
        </Link>

        <Link href="/student/attendance" className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3 hover:border-green-600 transition-all duration-200 apple-active-scale cursor-pointer group">
          <div className="h-10 w-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Tỷ lệ chuyên cần</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1 group-hover:text-green-600 transition-colors">{displayAttendance}</h3>
          </div>
        </Link>

        <Link href="/student/schedules" className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3 hover:border-purple-600 transition-all duration-200 apple-active-scale cursor-pointer group">
          <div className="h-10 w-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Chuyên đề ôn luyện</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1 group-hover:text-purple-600 transition-colors">{displaySubjectsCount} Khóa</h3>
          </div>
        </Link>
      </div>

      {/* Class Schedule detail view */}
      <Link href="/student/schedules" className="bg-canvas border border-hairline rounded-lg p-6 hover:border-primary transition-all duration-200 cursor-pointer block">
        <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4 flex justify-between items-center">
          <span>Lịch học hôm nay</span>
          <span className="text-xs text-primary font-semibold hover:underline">Chi tiết thời khóa biểu &rarr;</span>
        </h3>
        <div className="flex flex-col gap-4">
          {displaySchedules.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
              <div className="flex items-center gap-4">
                <span className="font-bold text-primary w-24">{item.time}</span>
                <div>
                  <p className="font-semibold text-ink">{item.subjectName}</p>
                  <p className="text-xs text-ink-muted-48">{item.teacherName} • {item.room}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                item.status.includes("Có mặt") || item.status.includes("điểm danh")
                  ? "bg-green-100 text-green-800" 
                  : "bg-orange-100 text-orange-800"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </Link>

    </div>
  );
}
