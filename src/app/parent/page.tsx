import React from "react";
import { Users, CheckSquare, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ParentDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      
      {/* Welcome Block */}
      <div>
        <h1 className="font-display-lg text-3xl font-semibold text-ink">Xin chào, Ông/Bà Nguyễn Văn B</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Hồ sơ phụ huynh của học sinh: <strong>Nguyễn Văn A</strong> (Lớp 10A1).</p>
      </div>

      {/* Child Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-blue-50 text-primary flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Điểm TB học tập của con (GPA)</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">8.6 / 10</h3>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Tỷ lệ chuyên cần của con</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">98.2%</h3>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Giáo viên chủ nhiệm lớp</p>
            <h3 className="font-body-strong text-lg font-bold text-ink mt-2">Thầy Nguyễn Văn Bình</h3>
            <p className="text-xs text-ink-muted-48 mt-0.5">SĐT: 0912 345 678</p>
          </div>
        </div>
      </div>

      {/* Latest updates about child */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Latest grades */}
        <div className="bg-canvas border border-hairline rounded-lg p-6">
          <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4">
            Đầu điểm mới nhận của con
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
              <div>
                <p className="font-semibold text-ink">Toán học nâng cao</p>
                <p className="text-xs text-ink-muted-48">Kiểm tra 15 phút</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary text-base">9.0</span>
                <p className="text-[10px] text-ink-muted-48">08/07/2026</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
              <div>
                <p className="font-semibold text-ink">Vật lý lý thuyết</p>
                <p className="text-xs text-ink-muted-48">Kiểm tra miệng</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary text-base">8.0</span>
                <p className="text-[10px] text-ink-muted-48">06/07/2026</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-divider-soft pb-3 last:border-0">
              <div>
                <p className="font-semibold text-ink">Tiếng Anh học thuật</p>
                <p className="text-xs text-ink-muted-48">Bài viết số 1</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary text-base">8.5</span>
                <p className="text-[10px] text-ink-muted-48">04/07/2026</p>
              </div>
            </div>
          </div>
          <Link href="/parent/grades" className="text-primary hover:underline font-caption text-xs font-semibold flex items-center gap-1 mt-4">
            Xem toàn bộ bảng điểm học tập <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Latest attendance */}
        <div className="bg-canvas border border-hairline rounded-lg p-6">
          <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4">
            Nhật ký chuyên cần 5 ngày qua
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink">Thứ Tư, 08/07/2026</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-sm font-semibold">Có mặt</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink">Thứ Ba, 07/07/2026</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-sm font-semibold">Có mặt</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink">Thứ Hai, 06/07/2026</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-sm font-semibold">Có mặt</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink">Thứ Sáu, 03/07/2026</span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-sm font-semibold">Nghỉ học có phép</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink">Thứ Năm, 02/07/2026</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-sm font-semibold">Có mặt</span>
            </div>
          </div>
          <Link href="/parent/attendance" className="text-primary hover:underline font-caption text-xs font-semibold flex items-center gap-1 mt-4">
            Xem báo cáo chuyên cần chi tiết <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

      </div>

    </div>
  );
}
