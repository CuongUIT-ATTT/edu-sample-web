import React from "react";
import Link from "next/link";
import { Check, Info, ShieldAlert, Award, FileCheck } from "lucide-react";

export default function FeesPage() {
  const packages = [
    {
      name: "Chuyên Đề Bứt Phá 10 & 11",
      price: "1,200,000đ",
      period: "tháng",
      target: "Bồi dưỡng nền tảng lớp 10, 11 bám sát kỳ thi tuyển sinh THPT quốc gia sớm.",
      features: [
        "2 ca học livestream lý thuyết chuyên đề / tuần",
        "Tải tài liệu tóm tắt công thức miễn phí",
        "Hỗ trợ giải đáp bài tập về nhà 24/7 từ study advisor",
        "Làm bài kiểm tra đánh giá năng lực cuối tháng",
      ],
      popular: false,
    },
    {
      name: "Luyện Đề VIP 12 Thực Chiến",
      price: "2,500,000đ",
      period: "tháng",
      target: "Luyện thi đại học chuyên sâu, đặc trị các dạng bài vận dụng cao và lỗi sai lý thuyết.",
      features: [
        "3 ca học livestream thực chiến cùng Thầy Hùng Cường",
        "Đặc quyền thi thử thi đấu cọ xát trực tiếp nhận quà",
        "Mở khóa toàn bộ tài liệu VIP & bài giải chi tiết",
        "Cam kết chất lượng tăng tối thiểu 1.5 - 2.0 điểm số",
        "Trang bị kỹ năng giải nhanh máy tính Casio thực chiến",
      ],
      popular: true,
    },
    {
      name: "Gói Cam Kết Đầu Ra 9+",
      price: "15,000,000đ",
      period: "khóa 1 năm",
      target: "Đào tạo kèm 1-1, ký hợp đồng cam kết pháp lý bằng văn bản có con dấu đỏ đỗ đại học nguyện vọng 1.",
      features: [
        "Học không giới hạn tất cả các ca chuyên đề & luyện đề",
        "Lộ trình ôn tập thiết kế riêng biệt cá nhân hóa",
        "Cam kết hoàn 100% học phí bằng hợp đồng văn bản nếu không đạt mục tiêu",
        "Điều kiện: Đi học đầy đủ ≥90% số ca học và hoàn thành các bài thi định kỳ",
        "Hỗ trợ đặc biệt 1-1 trực tiếp cùng Thầy Hùng Cường hàng tuần",
      ],
      popular: false,
    },
  ];

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-12">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Học phí & Học bổng
          </span>
          <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
            Đầu Tư Cho Tương Lai Đỗ Đạt
          </h1>
          <p className="font-lead text-ink-muted-80 text-sm max-w-[600px] leading-relaxed mt-1">
            Học phí minh bạch, cam kết chất lượng dạy và học thiết thực. Lựa chọn gói ôn thi phù hợp nhất với chặng đường mục tiêu của bạn.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {packages.map((pkg, idx) => {
            const orderClass = pkg.popular 
              ? "order-1 md:order-none" 
              : idx === 0 
                ? "order-2 md:order-none" 
                : "order-3 md:order-none";
            return (
              <div 
                key={pkg.name} 
                className={`bg-canvas border rounded-lg p-6 flex flex-col justify-between shadow-sm relative ${orderClass} ${
                  pkg.popular 
                    ? "border-primary ring-2 ring-primary ring-offset-2 lg:scale-105 z-10" 
                    : "border-hairline"
                }`}
              >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider shadow-sm">
                  Khóa nhiều học viên nhất
                </span>
              )}

              <div>
                <h3 className="font-tagline text-lg font-bold text-ink mb-2">{pkg.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-3xl font-extrabold text-ink tracking-tight">{pkg.price}</span>
                  <span className="text-xs text-ink-muted-48">/ {pkg.period}</span>
                </div>
                <p className="text-xs text-ink-muted-80 font-body leading-relaxed mb-6 border-b border-divider-soft pb-4">
                  {pkg.target}
                </p>

                <ul className="flex flex-col gap-3">
                  {pkg.features.map((feat) => (
                    <li key={feat} className="flex gap-2.5 items-start text-xs text-ink-muted-80 leading-relaxed font-body">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/admission"
                  className={`w-full py-2.5 rounded-pill font-body font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                    pkg.popular
                      ? "bg-primary hover:bg-primary-focus text-white"
                      : "bg-surface-pearl border border-divider-soft text-ink-muted-80 hover:text-ink hover:bg-divider-soft"
                  }`}
                >
                  Đăng ký tuyển sinh khóa học
                </Link>
              </div>
            </div>
          )})}
        </div>

        {/* Info Alerts */}
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start mt-8">
          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-body-strong text-sm font-semibold text-ink">Quỹ Học Bổng Đồng Hành - Thầy Hùng Cường</h4>
            <p className="text-xs text-ink-muted-80 leading-relaxed font-body">
              Học viên đạt danh hiệu **Thủ khoa tuần** trên Bảng xếp hạng online của trung tâm sẽ được tặng ngay **học bổng 50% học phí** tháng tiếp theo. Cuối năm, TOP 3 học viên đạt kết quả thi thử tốt nghiệp THPT cao nhất sẽ nhận phần thưởng trị giá **5,000,000đ tiền mặt** cùng cơ hội làm trợ giảng học tập tại trung tâm.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
