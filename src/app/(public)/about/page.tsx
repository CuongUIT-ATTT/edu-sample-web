import React from "react";
import Link from "next/link";
import { Award, Compass, Heart, Users, CheckCircle2, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-16">
        
        {/* Hero Section */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Về chúng tôi
          </span>
          <h1 className="font-display-lg text-4xl md:text-5xl font-semibold text-ink tracking-tight">
            Nơi Khởi Đầu Hành Trình <br />Đỗ Nguyện Vọng 1
          </h1>
          <p className="font-lead text-ink-muted-80 text-base max-w-[680px] leading-relaxed mt-2">
            EduWeb được sáng lập bởi đội ngũ giảng viên chuyên môn cao với mục tiêu tối giản lý thuyết, tập trung thực chiến luyện đề, mang lại phản xạ phòng thi tốt nhất cho học viên.
          </p>
        </div>

        {/* Core Values grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="font-body-strong text-lg font-semibold text-ink">Lộ trình tinh gọn</h3>
            <p className="text-xs text-ink-muted-80 leading-relaxed font-body">
              Chương trình học bám sát cấu trúc đề thi mới nhất của Bộ Giáo dục & Đào tạo, loại bỏ rườm rà, tập trung 80% thời lượng vào các dạng bài thi thực chiến.
            </p>
          </div>
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
            <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-body-strong text-lg font-semibold text-ink">Bảo đảm đầu ra 8+, 9+</h3>
            <p className="text-xs text-ink-muted-80 leading-relaxed font-body">
              Cam kết điểm số và chất lượng đào tạo bằng lộ trình cá nhân hóa, báo cáo tiến độ và điểm số học tập tự động cho phụ huynh hàng tuần.
            </p>
          </div>
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-body-strong text-lg font-semibold text-ink">Truyền lửa tự học</h3>
            <p className="text-xs text-ink-muted-80 leading-relaxed font-body">
              Xây dựng động lực học tập cạnh tranh thông qua bảng xếp hạng danh hiệu thi đua toàn trung tâm, thúc đẩy tinh thần thi đua không ngừng.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="flex flex-col gap-8">
          <div className="border-b border-divider-soft pb-4">
            <h2 className="font-display-lg text-2xl font-bold text-ink">Đội Ngũ Sáng Lập & Giảng Viên</h2>
            <p className="font-caption text-ink-muted-80 mt-1">Các thầy cô giáo tâm huyết với hàng chục năm kinh nghiệm ôn thi đại học</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Teacher 1 */}
            <div className="flex flex-col gap-3 bg-canvas border border-hairline rounded-lg overflow-hidden shadow-sm">
              <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                <img 
                  src="/teacher_hung_cuong.png" 
                  alt="Thầy Minh Trí" 
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="p-5 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Founder & Giảng viên Toán</span>
                <h4 className="font-body-strong text-base font-bold text-ink">Thầy Minh Trí</h4>
                <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
                  Cựu học sinh chuyên Toán ĐHQG, 10 năm kinh nghiệm biên soạn đề thi thử và ôn thi đại học lớp chuyên đề 9+.
                </p>
              </div>
            </div>

            {/* Teacher 2 */}
            <div className="flex flex-col gap-3 bg-canvas border border-hairline rounded-lg overflow-hidden shadow-sm">
              <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                <img 
                  src="/teacher_van_binh.png" 
                  alt="Thầy Nguyễn Văn Bình" 
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="p-5 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Đồng sáng lập & Giảng viên Vật lý</span>
                <h4 className="font-body-strong text-base font-bold text-ink">Thầy Nguyễn Văn Bình</h4>
                <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
                  Thạc sĩ Vật lý chất rắn, tác giả hàng loạt chuyên đề phương pháp giải nhanh cơ học và điện xoay chiều thi THPT.
                </p>
              </div>
            </div>

            {/* Teacher 3 */}
            <div className="flex flex-col gap-3 bg-canvas border border-hairline rounded-lg overflow-hidden shadow-sm">
              <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                <img 
                  src="/teacher_mai_anh.png" 
                  alt="Cô Lê Mai Anh" 
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="p-5 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Trưởng môn Tiếng Anh học thuật</span>
                <h4 className="font-body-strong text-base font-bold text-ink">Cô Lê Mai Anh</h4>
                <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
                  Đạt chứng chỉ IELTS 8.5, chuyên gia giảng dạy ngữ pháp cốt lõi và chiến thuật đọc hiểu bứt phá điểm thi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-canvas border border-hairline rounded-lg p-8 md:p-12 shadow-product flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-[500px]">
            <h3 className="font-tagline text-xl md:text-2xl font-bold text-ink">Sẵn sàng bứt phá điểm số thi cử?</h3>
            <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
              Nhận tư vấn lộ trình học tập miễn phí và tham gia làm đề thi khảo sát đánh giá năng lực đầu vào ngay hôm nay.
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link
              href="/admission"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold text-sm transition-colors text-center w-full md:w-auto flex items-center justify-center gap-2"
            >
              Đăng ký học thử <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
