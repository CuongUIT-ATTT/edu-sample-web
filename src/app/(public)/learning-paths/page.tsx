import React from "react";
import { Compass, Layers, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LearningPathsPage() {
  const paths = [
    {
      title: "Lộ Trình Bứt Phá Điểm 8+ THPT Quốc Gia",
      subtitle: "Dành riêng cho học sinh lớp 12 luyện thi tốt nghiệp đại học.",
      pathSlug: "but-pha-8-plus-thpt",
      icon: <Layers className="h-6 w-6 text-blue-600" />,
      bgIcon: "bg-blue-50",
      steps: [
        { name: "Giai đoạn 1: Quét sạch Chuyên đề lý thuyết", desc: "Xử lý triệt để toàn bộ kiến thức giáo trình cốt lõi, đặc trị các lỗi sai lý thuyết cơ bản." },
        { name: "Giai đoạn 2: Tổng ôn vận dụng cao (VDC)", desc: "Trang bị phương pháp giải nhanh trắc nghiệm, bấm máy tính Casio, sơ đồ tư duy liên kết." },
        { name: "Giai đoạn 3: Thực chiến luyện đề tuần", desc: "Thi thử cọ xát trực tiếp, phân tích phổ điểm lý thuyết và vận dụng để vá lỗ hổng kiến thức kịp thời." },
      ],
    },
    {
      title: "Lộ Trình Ôn Sớm & Học Tốt 10 & 11 VIP",
      subtitle: "Xây dựng tư duy học tập sớm cho học sinh THPT.",
      pathSlug: "on-som-lop-10-11-vip",
      icon: <Compass className="h-6 w-6 text-green-600" />,
      bgIcon: "bg-green-50",
      steps: [
        { name: "Giai đoạn 1: Nắm chắc kiến thức sách giáo khoa mới", desc: "Bồi dưỡng lý thuyết nền tảng vững vàng, làm bài tập tự luyện cuối mỗi buổi học." },
        { name: "Giai đoạn 2: Ôn tập sớm các dạng toán đề thi", desc: "Làm quen cấu trúc đề tuyển sinh quốc gia sớm để giảm áp lực cho năm học lớp 12." },
      ],
    },
    {
      title: "Chiến Dịch 90 Ngày Về Đích Cấp Tốc",
      subtitle: "Ôn thi chặng cuối trước kỳ thi THPT chính thức diễn ra.",
      pathSlug: "90-ngay-ve-dich-cap-toc",
      icon: <Zap className="h-6 w-6 text-amber-600" />,
      bgIcon: "bg-amber-50",
      steps: [
        { name: "Giai đoạn 1: Giải đề thi thử Sở & Trường Chuyên", desc: "Cọ xát với các dạng đề thi thử hot nhất trên cả nước, rèn phản xạ tốc độ làm bài thi." },
        { name: "Giai đoạn 2: Khóa chống sai ngu lý thuyết", desc: "Tập trung rà soát 20 câu hỏi lý thuyết dễ lấy điểm tuyệt đối để tránh mất điểm đáng tiếc." },
      ],
    },
  ];

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[840px] mx-auto flex flex-col gap-12">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Lộ Trình Học Tập
          </span>
          <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
            Đường Lên Thủ Khoa Thiết Kế Khoa Học
          </h1>
          <p className="font-lead text-ink-muted-80 text-sm max-w-[600px] leading-relaxed mt-1">
            Mỗi học viên khi bước vào EduWeb của Thầy Hùng Cường đều được định hướng lộ trình ôn luyện rõ ràng từng giai đoạn để đạt kết quả đỗ đại học cao nhất.
          </p>
        </div>

        {/* Path Cards */}
        <div className="flex flex-col gap-10 mt-6">
          {paths.map((path, pIdx) => (
            <div key={path.title} className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm flex flex-col gap-6">
              <div className="flex gap-4 items-center border-b border-divider-soft pb-4">
                <div className={`h-12 w-12 rounded-full ${path.bgIcon} flex items-center justify-center flex-shrink-0`}>
                  {path.icon}
                </div>
                <div>
                  <h3 className="font-tagline text-lg font-bold text-ink">{path.title}</h3>
                  <p className="text-xs text-ink-muted-80 font-body mt-0.5">{path.subtitle}</p>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="flex flex-col gap-6 pl-4 border-l border-divider-soft relative ml-4">
                {path.steps.map((step, sIdx) => (
                  <div key={step.name} className="relative flex flex-col gap-1 text-xs">
                    {/* Circle icon on line */}
                    <span className="absolute -left-[25px] top-0.5 h-4 w-4 rounded-full bg-canvas border-2 border-primary flex items-center justify-center text-[9px] font-bold text-primary">
                      {sIdx + 1}
                    </span>
                    <h4 className="font-body-strong font-bold text-ink text-sm">{step.name}</h4>
                    <p className="text-ink-muted-80 leading-relaxed font-body">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-divider-soft pt-4 mt-2">
                <Link
                  href={`/admission?path=${path.pathSlug}`}
                  className="bg-primary hover:bg-primary-focus text-white px-5 py-2 rounded-pill text-xs font-semibold apple-active-scale transition-colors shadow-sm flex items-center gap-1"
                >
                  Nhận tư vấn lộ trình này <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
