import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Clock, BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      
      {/* Hero Product Tile (Light) */}
      <section className="min-h-[85vh] bg-canvas text-ink flex flex-col justify-between items-center text-center py-20 px-6 relative">
        <div className="max-w-[800px] w-full flex flex-col items-center gap-4 mt-12 z-10">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-pearl text-primary text-xs font-semibold rounded-full border border-divider-soft">
            <Sparkles className="h-3 w-3" />
            Hệ thống quản lý thế hệ mới
          </span>
          <h1 className="font-hero-display text-5xl md:text-6xl tracking-tight text-ink font-semibold mt-2">
            Học đường hiện đại.<br />Không khoảng cách.
          </h1>
          <p className="font-lead text-xl md:text-2xl text-ink-muted-80 max-w-[620px] mt-4 leading-normal">
            Trải nghiệm quản lý học tập và giảng dạy trực quan tối ưu trên nền tảng Serverless tốc độ cao.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <Link 
              href="/login" 
              className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm flex items-center gap-2"
            >
              Vào học đường <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/courses" 
              className="text-primary hover:text-primary-focus font-body font-semibold inline-flex items-center gap-1.5 apple-active-scale hover:underline"
            >
              Xem khóa học
            </Link>
          </div>
        </div>

        {/* Product Imagery Mimic (Web UI Frame with Drop Shadow) */}
        <div className="max-w-[1000px] w-full mt-12 px-4 select-none relative z-10">
          <div className="bg-canvas border border-hairline rounded-lg shadow-product overflow-hidden p-3 aspect-[16/9] flex flex-col">
            <div className="flex items-center gap-1.5 pb-2 border-b border-divider-soft">
              <span className="h-3 w-3 rounded-full bg-red-400"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
              <span className="h-3 w-3 rounded-full bg-green-400"></span>
              <span className="text-[11px] text-ink-muted-48 ml-4 font-mono">eduweb.vn/dashboard</span>
            </div>
            <div className="flex-grow bg-canvas-parchment flex items-center justify-center p-8 rounded-sm text-center">
              <div className="max-w-[400px]">
                <h3 className="font-tagline text-lg font-semibold text-ink">Bảng Điều Khiển Quản Lý Học Tập</h3>
                <p className="text-sm text-ink-muted-80 mt-2 font-body">Thời khóa biểu, Chuyên cần và Sổ điểm được đồng bộ thời gian thực cho Giáo viên, Học sinh và Phụ huynh.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Product Tile (Dark) */}
      <section className="bg-surface-tile-1 text-on-dark flex flex-col items-center justify-center py-24 px-6 text-center border-t border-surface-tile-3">
        <div className="max-w-[980px] w-full flex flex-col items-center gap-6">
          <h2 className="font-display-lg text-3xl md:text-5xl text-white font-semibold">
            Đồng bộ tuyệt đối giữa 4 vai trò
          </h2>
          <p className="font-lead text-lg md:text-xl text-body-muted max-w-[700px] leading-relaxed">
            Hệ thống phân quyền Role-Based Access Control (RBAC) nghiêm ngặt giúp bảo mật thông tin và cung cấp giao diện riêng biệt cho từng thành viên.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mt-16 text-left">
            {/* Admin card */}
            <div className="bg-surface-tile-2 border border-surface-tile-3 rounded-lg p-6 flex flex-col justify-between min-h-[220px]">
              <div>
                <Shield className="h-6 w-6 text-primary-on-dark mb-4" />
                <h3 className="font-body-strong text-white text-lg font-semibold">Quản Trị Viên</h3>
                <p className="font-caption text-body-muted mt-2">
                  Quản lý danh sách học sinh, phân công lịch dạy cho giáo viên và kiểm soát cơ sở dữ liệu.
                </p>
              </div>
              <Link href="/login" className="text-primary-on-dark hover:underline font-caption flex items-center gap-1.5 mt-4">
                Khám phá cổng Admin <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Teacher card */}
            <div className="bg-surface-tile-2 border border-surface-tile-3 rounded-lg p-6 flex flex-col justify-between min-h-[220px]">
              <div>
                <BookOpen className="h-6 w-6 text-primary-on-dark mb-4" />
                <h3 className="font-body-strong text-white text-lg font-semibold">Giáo Viên</h3>
                <p className="font-caption text-body-muted mt-2">
                  Quản lý lớp học, thực hiện điểm danh lớp trực tuyến và theo dõi bảng điểm học sinh dễ dàng.
                </p>
              </div>
              <Link href="/login" className="text-primary-on-dark hover:underline font-caption flex items-center gap-1.5 mt-4">
                Xem nghiệp vụ dạy <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Student card */}
            <div className="bg-surface-tile-2 border border-surface-tile-3 rounded-lg p-6 flex flex-col justify-between min-h-[220px]">
              <div>
                <Clock className="h-6 w-6 text-primary-on-dark mb-4" />
                <h3 className="font-body-strong text-white text-lg font-semibold">Học Sinh</h3>
                <p className="font-caption text-body-muted mt-2">
                  Tra cứu thời khóa biểu cá nhân, theo dõi kết quả học tập và tình hình chuyên cần hàng ngày.
                </p>
              </div>
              <Link href="/login" className="text-primary-on-dark hover:underline font-caption flex items-center gap-1.5 mt-4">
                Xem góc học tập <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Parent card */}
            <div className="bg-surface-tile-2 border border-surface-tile-3 rounded-lg p-6 flex flex-col justify-between min-h-[220px]">
              <div>
                <Sparkles className="h-6 w-6 text-primary-on-dark mb-4" />
                <h3 className="font-body-strong text-white text-lg font-semibold">Phụ Huynh</h3>
                <p className="font-caption text-body-muted mt-2">
                  Nhận báo cáo nhanh chóng về tiến độ học tập và thông báo điểm danh của các con tại lớp.
                </p>
              </div>
              <Link href="/login" className="text-primary-on-dark hover:underline font-caption flex items-center gap-1.5 mt-4">
                Theo dõi kết quả con <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Utilities Product Tile (Parchment) */}
      <section className="bg-canvas-parchment text-ink flex flex-col items-center justify-center py-24 px-6 text-center border-t border-hairline">
        <div className="max-w-[760px] w-full flex flex-col items-center gap-6">
          <h2 className="font-display-lg text-3xl md:text-5xl text-ink font-semibold">
            Giải pháp tinh gọn, hoạt động bền vững
          </h2>
          <p className="font-lead text-lg md:text-xl text-ink-muted-80 leading-relaxed">
            Dự án vận hành trên kiến trúc phi máy chủ (Serverless), loại bỏ chi phí duy trì máy chủ tĩnh và tối ưu ngân sách vận hành cho cơ sở giáo dục.
          </p>
          <div className="flex gap-4 mt-8">
            <Link 
              href="/admission" 
              className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm"
            >
              Gửi hồ sơ tuyển sinh
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
