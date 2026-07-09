import React from "react";
import { Calendar, CheckSquare, Award } from "lucide-react";

export default function StudentDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      
      {/* Welcome Block */}
      <div>
        <h1 className="font-display-lg text-3xl font-semibold text-ink">Xin chào, Nguyễn Văn A</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Lớp 10A1 • Mã học sinh: HS-10023. Chúc bạn một ngày học tập hiệu quả!</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-blue-50 text-primary flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Điểm trung bình học kỳ (GPA)</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">8.6 / 10</h3>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Tỷ lệ chuyên cần</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">98.2%</h3>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Môn học học kỳ này</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">8 Môn</h3>
          </div>
        </div>
      </div>

      {/* Class Schedule detail view */}
      <div className="bg-canvas border border-hairline rounded-lg p-6">
        <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4">
          Thời khóa biểu hôm nay
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-primary w-20">08:00 - 09:30</span>
              <div>
                <p className="font-semibold text-ink">Toán học nâng cao</p>
                <p className="text-xs text-ink-muted-48">Thầy Nguyễn Văn Bình • Phòng 302</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-semibold">Đã điểm danh - Có mặt</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-primary w-20">10:00 - 11:30</span>
              <div>
                <p className="font-semibold text-ink">Vật lý lý thuyết</p>
                <p className="text-xs text-ink-muted-48">Cô Lê Thị Hoa • Phòng 401</p>
              </div>
            </div>
            <span className="text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-semibold">Chưa bắt đầu</span>
          </div>
        </div>
      </div>

    </div>
  );
}
