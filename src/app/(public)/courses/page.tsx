import React from "react";
import Link from "next/link";
import { BookOpen, Star, Clock, Zap, ArrowRight, BadgeCheck } from "lucide-react";

const COURSES = [
  {
    id: "math-10",
    name: "Toán học nâng cao Lớp 10",
    description: "Chương trình chuyên sâu về Đại số và Hình học không gian chuẩn bị cho học sinh THPT.",
    level: "Khối 10",
    duration: "36 tuần",
    rating: 4.9,
  },
  {
    id: "phy-11",
    name: "Vật lý lý thuyết & Thực nghiệm Lớp 11",
    description: "Khám phá Cơ học chất lưu, Điện từ học và Quang hình học qua các bài thực hành trực quan.",
    level: "Khối 11",
    duration: "36 tuần",
    rating: 4.8,
  },
  {
    id: "chem-12",
    name: "Hóa học hữu cơ & Vô cơ Lớp 12",
    description: "Ôn tập chuyên đề thi tốt nghiệp THPT Quốc gia và đại học trọng tâm Hóa học.",
    level: "Khối 12",
    duration: "32 tuần",
    rating: 5.0,
  },
  {
    id: "eng-ielts",
    name: "Tiếng Anh học thuật & IELTS 6.5+",
    description: "Rèn luyện tư duy phản biện viết và kỹ năng nghe nói phản xạ tự nhiên chuẩn quốc tế.",
    level: "Mọi khối lớp",
    duration: "24 tuần",
    rating: 4.9,
  },
];

const MONTHLY_PACKAGES = [
  {
    id: "basic",
    label: "Cơ Bản",
    sessions: 4,
    price: 800_000,
    color: "border-hairline",
    highlight: false,
    badge: null,
    features: ["4 buổi học / tháng", "Tài liệu bài giảng PDF", "Nhóm hỗ trợ Zalo"],
  },
  {
    id: "standard",
    label: "Tiêu Chuẩn",
    sessions: 8,
    price: 1_400_000,
    color: "border-blue-300",
    highlight: false,
    badge: null,
    features: ["8 buổi học / tháng", "Tài liệu bài giảng PDF", "Nhóm hỗ trợ Zalo", "Chấm bài tập về nhà"],
  },
  {
    id: "vip",
    label: "VIP",
    sessions: 12,
    price: 1_800_000,
    color: "border-primary",
    highlight: true,
    badge: "Phổ biến nhất",
    features: [
      "12 buổi học / tháng",
      "Tài liệu VIP + Đề thi thử",
      "Nhóm hỗ trợ Zalo 24/7",
      "Chấm bài tập về nhà",
      "Thi thử online không giới hạn",
    ],
  },
  {
    id: "intensive",
    label: "Chuyên Sâu",
    sessions: 16,
    price: 2_200_000,
    color: "border-amber-400",
    highlight: false,
    badge: "Luyện thi cấp tốc",
    features: [
      "16 buổi học / tháng",
      "Toàn bộ tài liệu VIP",
      "Hỗ trợ 1-1 với giảng viên",
      "Lịch học linh hoạt",
      "Cam kết điểm đầu ra",
    ],
  },
];

export default function CoursesPage() {
  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-16">

        {/* Header Section */}
        <div className="max-w-[700px] flex flex-col gap-4">
          <h1 className="font-display-lg text-4xl font-semibold text-ink">Chương Trình Đào Tạo</h1>
          <p className="font-body text-ink-muted-80">
            Hệ thống bài giảng và môn học chất lượng cao, bám sát khung chương trình chuẩn và mở rộng kiến thức thực tiễn.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col justify-between hover:border-primary-focus transition-all duration-200"
            >
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-sm bg-canvas-parchment text-primary flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted-48 mb-1">
                    <span>{course.level}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {course.duration}</span>
                  </div>
                  <h3 className="font-body-strong text-ink text-lg font-semibold leading-tight line-clamp-2">
                    {course.name}
                  </h3>
                  <p className="font-caption text-ink-muted-80 mt-2 line-clamp-3">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-divider-soft pt-4 mt-6">
                <div className="flex items-center gap-1 text-xs text-yellow-600 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{course.rating}</span>
                </div>
                {/* Redirect to /admission instead of /login — tài khoản cấp qua đăng ký tư vấn */}
                <Link
                  href="/admission"
                  className="text-primary hover:underline font-caption font-semibold apple-active-scale"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Info banner — giải thích cơ chế tài khoản */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 flex items-start gap-3">
          <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
            <strong className="text-ink">Tài khoản học viên được cấp miễn phí</strong> sau khi hoàn thành đăng ký tư vấn lộ trình và được ban tuyển sinh xác nhận. Nhấn <em>"Đăng ký ngay"</em> để bắt đầu.
          </p>
        </div>

        {/* ── Monthly Package Section ── */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200 w-fit">
              Học phí VIP Theo Tháng
            </span>
            <h2 className="font-display-lg text-3xl font-semibold text-ink">Gói Học Linh Hoạt Theo Tháng</h2>
            <p className="font-body text-ink-muted-80 max-w-[600px]">
              Lựa chọn số buổi học phù hợp với lịch học và mục tiêu của bạn. Tất cả các gói đều bao gồm tài liệu bài giảng và hỗ trợ nhóm Zalo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MONTHLY_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-canvas border-2 ${pkg.color} rounded-lg p-6 flex flex-col gap-5 relative ${
                  pkg.highlight ? "shadow-product" : "shadow-sm"
                } transition-all hover:-translate-y-0.5 hover:shadow-product`}
              >
                {/* Badge */}
                {pkg.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                    pkg.highlight
                      ? "bg-primary text-white"
                      : "bg-amber-500 text-white"
                  }`}>
                    {pkg.badge}
                  </span>
                )}

                {/* Header */}
                <div className="flex flex-col gap-1 pt-2">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${pkg.highlight ? "text-primary" : "text-ink-muted-48"}`} />
                    <span className="font-body-strong text-sm font-bold text-ink">{pkg.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold text-ink font-display-lg">
                      {pkg.price.toLocaleString("vi-VN")}đ
                    </span>
                    <span className="text-xs text-ink-muted-48 font-body">/ tháng</span>
                  </div>
                  <p className="text-xs text-ink-muted-80 font-body mt-1">
                    <strong>{pkg.sessions} buổi</strong> học / tháng
                    <span className="text-ink-muted-48"> ({Math.round(pkg.price / pkg.sessions / 1000)}k / buổi)</span>
                  </p>
                </div>

                {/* Feature list */}
                <ul className="flex flex-col gap-2 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-ink-muted-80 font-body">
                      <BadgeCheck className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${pkg.highlight ? "text-primary" : "text-green-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={`/admission?package=${pkg.id}`}
                  className={`w-full text-center py-2.5 rounded-pill font-body font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    pkg.highlight
                      ? "bg-primary hover:bg-primary-focus text-white shadow-sm"
                      : "border border-primary text-primary hover:bg-blue-50"
                  }`}
                >
                  Đăng ký gói này <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
