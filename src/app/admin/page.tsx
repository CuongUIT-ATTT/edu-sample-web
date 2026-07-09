import React from "react";
import { Users, BookOpen, GraduationCap, Calendar, Plus } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px]">
      
      {/* Welcome Block */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="font-display-lg text-3xl font-semibold text-ink">Xin chào, Quản trị viên</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Dưới đây là tổng quan hiện trạng hoạt động của hệ thống trường học hôm nay.</p>
        </div>
        <button className="bg-primary hover:bg-primary-focus text-white px-4 py-2.5 rounded-pill font-caption-strong text-xs flex items-center gap-1.5 apple-active-scale transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Tạo người dùng mới
        </button>
      </div>

      {/* Stats Cards (store-utility-card style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-blue-50 text-primary flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Tổng Giáo Viên</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">28</h3>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-green-50 text-green-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Tổng Học Sinh</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">452</h3>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Số Lớp Học</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">16</h3>
          </div>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-sm bg-orange-50 text-orange-600 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-ink-muted-48 uppercase font-semibold">Tiết học hôm nay</p>
            <h3 className="font-display-lg text-2xl font-bold text-ink mt-1">64</h3>
          </div>
        </div>
      </div>

      {/* Detail Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent actions */}
        <div className="bg-canvas border border-hairline rounded-lg p-6">
          <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4">
            Hoạt động hệ thống gần đây
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start text-xs border-b border-divider-soft pb-3 last:border-0">
              <div>
                <p className="font-semibold text-ink">Thêm thời khóa biểu mới lớp 10A1</p>
                <p className="text-ink-muted-48 mt-0.5">Thực hiện bởi Admin</p>
              </div>
              <span className="text-ink-muted-48">10 phút trước</span>
            </div>
            <div className="flex justify-between items-start text-xs border-b border-divider-soft pb-3 last:border-0">
              <div>
                <p className="font-semibold text-ink">Cập nhật hồ sơ học sinh Nguyễn Văn A</p>
                <p className="text-ink-muted-48 mt-0.5">Thực hiện bởi Admin</p>
              </div>
              <span className="text-ink-muted-48">1 giờ trước</span>
            </div>
            <div className="flex justify-between items-start text-xs border-b border-divider-soft pb-3 last:border-0">
              <div>
                <p className="font-semibold text-ink">Khởi tạo tài khoản giáo viên Lê Thị B</p>
                <p className="text-ink-muted-48 mt-0.5">Thực hiện bởi Admin</p>
              </div>
              <span className="text-ink-muted-48">4 giờ trước</span>
            </div>
          </div>
        </div>

        {/* Classes quick view */}
        <div className="bg-canvas border border-hairline rounded-lg p-6">
          <h3 className="font-body-strong text-lg font-semibold text-ink border-b border-divider-soft pb-4 mb-4">
            Xem nhanh danh sách lớp
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-ink">Lớp 10A1</span>
              <span className="text-xs bg-canvas-parchment text-ink-muted-80 px-2.5 py-1 rounded-sm">32 Học sinh</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-ink">Lớp 11B2</span>
              <span className="text-xs bg-canvas-parchment text-ink-muted-80 px-2.5 py-1 rounded-sm">30 Học sinh</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-ink">Lớp 12C3</span>
              <span className="text-xs bg-canvas-parchment text-ink-muted-80 px-2.5 py-1 rounded-sm">28 Học sinh</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
