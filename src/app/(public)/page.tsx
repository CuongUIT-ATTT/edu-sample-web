"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Trophy,
  BookOpen,
  Clock,
  Users,
  Play,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  GraduationCap,
  Zap,
  Target,
  Flame,
} from "lucide-react";

import { getSystemStats } from "@/actions/quizzes";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

export default function HomePage() {
  // Countdown to THPT Quốc Gia 2027 (Approx June 25, 2027)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [realStats, setRealStats] = useState({
    totalQuizzes: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    totalCourses: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const examDate = new Date("2027-06-25T07:30:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = examDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    const fetchStats = async () => {
      try {
        const res = await getSystemStats();
        if (res.success && res.data) {
          setRealStats(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch system stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();

    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      value: loadingStats ? "..." : `${realStats.totalQuizzes || 0}`,
      label: "Đề thi thử trực tuyến",
      subtext: "Bám sát cấu trúc Bộ GD&ĐT",
      icon: <BookOpen className="h-5 w-5" />,
      variant: "blue" as const,
    },
    {
      value: loadingStats ? "..." : `${realStats.totalStudents || 0}`,
      label: "Học viên đang luyện đề",
      subtext: "Hệ thống thi đua xếp hạng",
      icon: <Users className="h-5 w-5" />,
      variant: "emerald" as const,
    },
    {
      value: loadingStats ? "..." : `${realStats.totalCourses || 0}`,
      label: "Lớp học & Chuyên đề VIP",
      subtext: "Giảng dạy bởi giáo viên chuyên môn",
      icon: <GraduationCap className="h-5 w-5" />,
      variant: "purple" as const,
    },
    {
      value: loadingStats ? "..." : `${realStats.totalSubmissions || 0}`,
      label: "Lượt làm bài đã chấm",
      subtext: "Tự động phân tích điểm",
      icon: <BarChart3 className="h-5 w-5" />,
      variant: "amber" as const,
    },
  ];

  const features = [
    {
      badge: "Công nghệ Mã Đề",
      title: "Tráo câu & Đáp án Tự động",
      description: "Mỗi học sinh nhận một mã đề ngẫu nhiên duy nhất với thứ tự câu hỏi và phương án được xáo trộn, ngăn chặn tuyệt đối việc trao đổi đáp án.",
      icon: <ShieldCheck className="h-5 w-5" />,
      variant: "blue" as const,
    },
    {
      badge: "Phân tích Năng lực",
      title: "Chấm Điểm & Phổ Điểm Thời Gian Thực",
      description: "Xem ngay kết quả làm bài kèm phân tích ma trận kiến thức: phát hiện nhanh vùng lý thuyết hổng để tập trung ôn luyện trọng tâm.",
      icon: <BarChart3 className="h-5 w-5" />,
      variant: "emerald" as const,
    },
    {
      badge: "Luyện Tập Thông Minh",
      title: "Giải Chi Tiết & Công Thức LaTeX",
      description: "Tất cả câu hỏi đều có đáp án chi tiết, trình bày chuẩn công thức Toán - Lý - Hóa đẹp mắt, giúp học sinh tự học chuyên sâu dễ dàng.",
      icon: <Zap className="h-5 w-5" />,
      variant: "purple" as const,
    },
    {
      badge: "Theo Dõi Tiến Độ",
      title: "Phân Phối Đề Thi Theo Lớp Học",
      description: "Giáo viên dễ dàng giao đề cho từng lớp học, thiết lập thời gian làm bài, hạn nộp và theo dõi tỷ lệ hoàn thành của từng học sinh.",
      icon: <Target className="h-5 w-5" />,
      variant: "amber" as const,
    },
  ];

  const subjects = [
    { name: "Toán Học", code: "MATH", count: "Kho Đề Thi", icon: "📐" },
    { name: "Vật Lý", code: "PHYS", count: "Kho Đề Thi", icon: "⚡" },
    { name: "Hóa Học", code: "CHEM", count: "Kho Đề Thi", icon: "🧪" },
    { name: "Tiếng Anh", code: "ENG", count: "Kho Đề Thi", icon: "🌐" },
    { name: "Ngữ Văn", code: "LIT", count: "Kho Đề Thi", icon: "📖" },
    { name: "Sinh Học", code: "BIO", count: "Kho Đề Thi", icon: "🧬" },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden bg-canvas-parchment transition-colors">
      {/* Dynamic Sticky Countdown Notification Banner */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-900 via-primary to-indigo-900 text-white py-2.5 px-4 text-center text-xs font-semibold select-none flex items-center justify-center gap-3 flex-wrap shadow-md border-b border-white/10">
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300 flex-shrink-0" />
          <span className="tracking-wide">Đếm ngược Kỳ thi Tốt nghiệp THPT Quốc Gia 2027:</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[13px] font-bold">
          <span className="bg-black/30 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
            <strong className="text-amber-300">{timeLeft.days}</strong> ngày
          </span>
          <span className="bg-black/30 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
            <strong className="text-amber-300">{timeLeft.hours}</strong>h
          </span>
          <span className="bg-black/30 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
            <strong className="text-amber-300">{timeLeft.minutes}</strong>m
          </span>
          <span className="bg-black/30 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
            <strong className="text-amber-300">{timeLeft.seconds}</strong>s
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] bg-canvas text-ink flex flex-col justify-center items-center text-center py-20 px-6 overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(41,151,255,0.12),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_40%)]" />

        <div className="max-w-[920px] w-full flex flex-col items-center gap-6 z-10">
          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-primary dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-800/60 shadow-xs animate-fade-in">
            <Trophy className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <span>Nền tảng Ôn luyện THPT Quốc Gia Chuẩn Cấu Trúc Bộ GD&amp;ĐT</span>
          </div>

          {/* Main Title */}
          <h1 className="font-hero-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-ink font-bold leading-[1.1] max-w-[880px]">
            Luyện Thi Thông Minh. <br />
            <span className="bg-gradient-to-r from-blue-600 via-primary to-indigo-600 bg-clip-text text-transparent">
              Đỗ Nguyện Vọng 1.
            </span>
          </h1>

          {/* Lead Paragraph */}
          <p className="font-lead text-base sm:text-lg md:text-xl text-ink-muted-80 max-w-[680px] leading-relaxed font-body">
            Học sâu hiểu bản chất, thực chiến làm đề thi thử chuẩn ma trận minh họa. Hệ thống xáo đề thông minh của <strong>EduWeb</strong> cam kết mang lại bứt phá điểm số tối ưu cho mục tiêu đại học mơ ước.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-4 mt-4 flex-wrap justify-center w-full max-w-[480px]">
            <Link
              href="/admission"
              className="flex-1 min-w-[200px] bg-primary hover:bg-primary-focus text-white px-7 py-3.5 rounded-pill font-body font-semibold apple-active-scale transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              Đăng ký học thử miễn phí <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/quizzes"
              className="flex-1 min-w-[180px] bg-canvas border border-hairline hover:border-primary text-ink hover:text-primary px-7 py-3.5 rounded-pill font-body font-semibold text-xs sm:text-sm apple-active-scale transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 fill-current text-primary" /> Thi thử Demo ngay
            </Link>
          </div>
        </div>

        {/* Dynamic System Stats Bento Cards */}
        <div className="max-w-[1100px] w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16 z-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-canvas/90 backdrop-blur-md border border-hairline rounded-lg p-6 shadow-product hover:border-primary transition-all duration-200 text-left flex flex-col justify-between apple-active-scale group"
            >
              <div className="flex items-center justify-between">
                <StitchIconBadge icon={stat.icon} variant={stat.variant} size="md" />
                <span className="text-[10px] font-bold text-ink-muted-48 uppercase tracking-wider bg-canvas-parchment px-2 py-0.5 rounded border border-hairline">
                  Hệ thống EduWeb
                </span>
              </div>
              <div className="mt-6">
                <p className="text-3xl font-extrabold text-ink font-tagline group-hover:text-primary transition-colors">
                  {stat.value}
                </p>
                <h4 className="font-body-strong text-sm font-semibold text-ink mt-1">
                  {stat.label}
                </h4>
                <p className="text-xs text-ink-muted-48 mt-0.5">{stat.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="bg-canvas-parchment py-24 px-6 border-t border-hairline">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-16">
          <div className="text-center max-w-[640px] mx-auto flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Tính năng vượt trội
            </span>
            <h2 className="font-display-lg text-3xl sm:text-4xl font-bold text-ink leading-tight">
              Giải Pháp Ôn Thi Toàn Diện Cho Học Sinh THPT
            </h2>
            <p className="font-caption text-ink-muted-80 text-sm leading-relaxed">
              Kết hợp công nghệ đảo đề thi tự động, ngân hàng câu hỏi bám sát ma trận Bộ GD&amp;ĐT cùng giao diện trải nghiệm mượt mà.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="bg-canvas border border-hairline rounded-lg p-7 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-6 group"
              >
                <div className="flex items-start gap-4">
                  <StitchIconBadge icon={feat.icon} variant={feat.variant} size="lg" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {feat.badge}
                    </span>
                    <h3 className="font-body-strong text-lg font-bold text-ink group-hover:text-primary transition-colors">
                      {feat.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-ink-muted-80 font-body leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Exam Interactive Preview Section */}
      <section className="bg-canvas text-ink py-24 px-6 border-t border-hairline">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800/60 w-fit">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Giao Diện Thi Thử Thực Chiến</span>
            </div>
            <h2 className="font-display-lg text-3xl sm:text-4xl font-bold text-ink leading-tight">
              Trải Nghiệm Phòng Thi Online Như Thi Thật
            </h2>
            <p className="text-sm text-ink-muted-80 font-body leading-relaxed">
              Không chỉ xem lý thuyết thụ động, học sinh được bấm giờ làm đề thi trắc nghiệm trực tuyến, chấm điểm tức thì và phân tích phổ điểm chi tiết.
            </p>

            <div className="flex flex-col gap-3 text-xs text-ink-muted-80 font-body">
              <div className="flex items-center gap-3 bg-canvas-parchment p-3.5 rounded-lg border border-hairline">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Hệ thống tự động thu bài</strong> chính xác khi hết thời gian đếm ngược.</span>
              </div>
              <div className="flex items-center gap-3 bg-canvas-parchment p-3.5 rounded-lg border border-hairline">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Hỗ trợ công thức Toán LaTeX</strong> hiển thị sắc nét trên cả máy tính &amp; điện thoại.</span>
              </div>
              <div className="flex items-center gap-3 bg-canvas-parchment p-3.5 rounded-lg border border-hairline">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span><strong>Bảng xếp hạng thi đua</strong> tự động cập nhật thứ hạng bài làm sau khi nộp.</span>
              </div>
            </div>

            <div className="mt-2">
              <Link
                href="/quizzes"
                className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill text-xs font-semibold apple-active-scale transition-colors shadow-sm inline-flex items-center gap-2 w-fit"
              >
                Vào Ngân Hàng Đề Thi <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Interactive Mock Quiz Window */}
          <div className="bg-canvas border border-hairline rounded-lg shadow-product overflow-hidden p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider-soft">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                <span className="h-3 w-3 rounded-full bg-green-400"></span>
                <span className="text-xs font-mono text-ink-muted-48 ml-3">
                  eduweb.vn/quizzes/exam-2027
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Đang Thi Thử
              </span>
            </div>

            <div className="bg-canvas-parchment p-5 rounded-lg border border-hairline flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-semibold text-ink-muted-80 border-b border-divider-soft pb-3">
                <span>Đề thi thử Toán THPT 2027 • Mã đề: <strong>MD-8421</strong></span>
                <span className="text-primary font-mono font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> 48:20
                </span>
              </div>

              <div className="text-left flex flex-col gap-3">
                <p className="text-xs sm:text-sm font-bold text-ink leading-relaxed">
                  Câu 15: Cho hàm số f(x) có bảng biến thiên như hình vẽ. Hỏi giá trị cực đại của hàm số là bao nhiêu?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 border border-primary bg-blue-50/60 dark:bg-blue-950/50 text-primary font-semibold rounded-lg flex items-center justify-between cursor-pointer">
                    <span>A. y = 3</span>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="p-3 border border-hairline bg-canvas text-ink rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <span>B. y = -1</span>
                  </div>
                  <div className="p-3 border border-hairline bg-canvas text-ink rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <span>C. y = 0</span>
                  </div>
                  <div className="p-3 border border-hairline bg-canvas text-ink rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <span>D. y = 2</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-divider-soft pt-3 flex justify-between items-center text-xs">
                <span className="text-ink-muted-48">Đã làm: 15 / 50 câu</span>
                <button
                  type="button"
                  className="bg-primary text-white text-xs px-4 py-1.5 rounded-pill font-semibold shadow-xs"
                >
                  Nộp bài ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subject Categories Showcase */}
      <section className="bg-canvas-parchment py-24 px-6 border-t border-hairline">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-12 text-center">
          <div className="max-w-[600px] mx-auto flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Môn học trọng tâm
            </span>
            <h2 className="font-display-lg text-3xl sm:text-4xl font-bold text-ink">
              Các Khối Thi &amp; Chuyên Đề Tốt Nghiệp
            </h2>
            <p className="font-caption text-ink-muted-80 text-sm">
              Đầy đủ ngân hàng câu hỏi ôn luyện theo từng khối xét tuyển Đại học (A00, A01, B00, C00, D01).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map((sub) => (
              <Link
                key={sub.name}
                href="/quizzes"
                className="bg-canvas border border-hairline rounded-lg p-5 flex flex-col items-center text-center gap-3 hover:border-primary transition-all duration-200 apple-active-scale group shadow-sm"
              >
                <div className="text-3xl">{sub.icon}</div>
                <div>
                  <h3 className="font-body-strong text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    {sub.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-ink-muted-48 block mt-0.5">
                    {sub.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="bg-gradient-to-b from-canvas-parchment to-canvas text-ink py-24 px-6 border-t border-hairline text-center">
        <div className="max-w-[760px] mx-auto bg-canvas border border-hairline rounded-lg p-10 sm:p-14 shadow-product flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(41,151,255,0.1),transparent_60%)]" />

          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shadow-xs z-10">
            <Flame className="h-7 w-7 text-primary" />
          </div>

          <h2 className="font-display-lg text-3xl sm:text-4xl font-bold text-ink leading-tight z-10">
            Đừng Bỏ Lỡ Giai Đoạn Vàng Để Ôn Thi THPT Quốc Gia
          </h2>
          <p className="font-lead text-sm sm:text-base text-ink-muted-80 max-w-[560px] leading-relaxed font-body z-10">
            Đăng ký học thử miễn phí ngay hôm nay để trải nghiệm toàn bộ kho đề thi thử và nhận tài liệu ôn luyện VIP từ EduWeb.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full max-w-[420px] justify-center z-10">
            <Link
              href="/admission"
              className="flex-1 bg-primary hover:bg-primary-focus text-white px-8 py-3.5 rounded-pill font-body font-semibold apple-active-scale transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              Gửi Hồ Sơ Nhập Học Ngay <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="text-[11px] text-ink-muted-48 z-10">
            Miễn phí 100% tài liệu ôn thi ban đầu • Không yêu cầu thẻ tín dụng
          </p>
        </div>
      </section>
    </div>
  );
}
