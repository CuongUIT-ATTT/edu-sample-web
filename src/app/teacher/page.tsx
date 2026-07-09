import React from "react";
import Link from "next/link";
import { CheckSquare, TrendingUp, Calendar, ArrowRight } from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      
      {/* Welcome Block */}
      <div>
        <h1 className="font-display-lg text-3xl font-semibold text-ink">Xin chào, Thầy/Cô</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Hôm nay Thầy/Cô có 3 tiết dạy. Hãy theo dõi và cập nhật tiến độ học tập lớp học.</p>
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
          Lịch giảng dạy hôm nay (Thứ Năm)
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-primary w-20">08:00 - 09:30</span>
              <div>
                <p className="font-semibold text-ink">Toán học nâng cao</p>
                <p className="text-xs text-ink-muted-48">Lớp 10A1 • Phòng 302</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-semibold">Đã hoàn thành</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-primary w-20">10:00 - 11:30</span>
              <div>
                <p className="font-semibold text-ink">Giải tích học phần 1</p>
                <p className="text-xs text-ink-muted-48">Lớp 12B3 • Phòng 405</p>
              </div>
            </div>
            <span className="text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-semibold">Sắp diễn ra</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-primary w-20">14:00 - 15:30</span>
              <div>
                <p className="font-semibold text-ink">Toán đại số cơ bản</p>
                <p className="text-xs text-ink-muted-48">Lớp 11A2 • Phòng 304</p>
              </div>
            </div>
            <span className="text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-semibold">Sắp diễn ra</span>
          </div>
        </div>
      </div>

    </div>
  );
}
