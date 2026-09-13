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
  ChevronRight,
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
      subtext: "Bám sát ma trận Bộ GD&ĐT",
      icon: <BookOpen className="h-5 w-5" />,
      variant: "blue" as const,
    },
    {
      value: loadingStats ? "..." : `${realStats.totalStudents || 0}`,
      label: "Học viên đang ôn thi",
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
      subtext: "Tự động phân tích ma trận điểm",
      icon: <BarChart3 className="h-5 w-5" />,
      variant: "amber" as const,
    },
  ];

  const features = [
    {
      badge: "Công nghệ Mã Đề",
      title: "Tráo câu & Đáp án Tự động",
      description: "Mỗi học sinh nhận một mã đề ngẫu nhiên duy nhất với thứ tự câu hỏi và phương án được xáo trộn, ngăn chặn tuyệt đối việc trao đổi đáp án.",
      icon: <ShieldCheck className="h-6 w-6" />,
      variant: "blue" as const,
    },
    {
      badge: "Phân tích Năng lực",
      title: "Chấm Điểm & Phổ Điểm Thời Gian Thực",
      description: "Xem ngay kết quả làm bài kèm phân tích ma trận kiến thức: phát hiện nhanh vùng lý thuyết hổng để tập trung ôn luyện trọng tâm.",
      icon: <BarChart3 className="h-6 w-6" />,
      variant: "emerald" as const,
    },
    {
      badge: "Luyện Tập Thông Minh",
      title: "Giải Chi Tiết & Công Thức LaTeX",
      description: "Tất cả câu hỏi đều có đáp án chi tiết, trình bày chuẩn công thức Toán - Lý - Hóa đẹp mắt, giúp học sinh tự học chuyên sâu dễ dàng.",
      icon: <Zap className="h-6 w-6" />,
      variant: "purple" as const,
    },
    {
      badge: "Theo Dõi Tiến Độ",
      title: "Phân Phối Đề Thi Theo Lớp Học",
      description: "Giáo viên dễ dàng giao đề cho từng lớp học, thiết lập thời gian làm bài, hạn nộp và theo dõi tỷ lệ hoàn thành của từng học sinh.",
      icon: <Target className="h-6 w-6" />,
      variant: "amber" as const,
    },
  ];

  const subjects = [
    { name: "Toán Học", code: "MATH", count: "Kho Đề Thi", icon: "📐", color: "from-blue-500/20 to-indigo-500/20" },
    { name: "Vật Lý", code: "PHYS", count: "Kho Đề Thi", icon: "⚡", color: "from-amber-500/20 to-orange-500/20" },
    { name: "Hóa Học", code: "CHEM", count: "Kho Đề Thi", icon: "🧪", color: "from-emerald-500/20 to-teal-500/20" },
    { name: "Tiếng Anh", code: "ENG", count: "Kho Đề Thi", icon: "🌐", color: "from-purple-500/20 to-pink-500/20" },
    { name: "Ngữ Văn", code: "LIT", count: "Kho Đề Thi", icon: "📖", color: "from-rose-500/20 to-red-500/20" },
    { name: "Sinh Học", code: "BIO", count: "Kho Đề Thi", icon: "🧬", color: "from-cyan-500/20 to-blue-500/20" },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden bg-canvas text-ink transition-colors duration-300">
      {/* Liquid Glass Dynamic Countdown Banner */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-gradient-to-r from-blue-900/90 via-primary/95 to-indigo-900/90 text-white py-3 px-4 text-center text-xs font-semibold select-none flex items-center justify-center gap-3 flex-wrap shadow-lg border-b border-white/15">
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/25 shadow-inner">
          <Sparkles className="h-4 w-4 animate-pulse text-amber-300 flex-shrink-0" />
          <span className="tracking-wide">Đếm ngược Kỳ thi Tốt nghiệp THPT Quốc Gia 2027:</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs sm:text-[13px] font-bold">
          <span className="bg-black/35 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-xs">
            <strong className="text-amber-300 text-sm">{timeLeft.days}</strong> ngày
          </span>
          <span className="bg-black/35 backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-xs">
            <strong className="text-amber-300 text-sm">{timeLeft.hours}</strong>h
          </span>
          <span className="bg-black/35 backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-xs">
            <strong className="text-amber-300 text-sm">{timeLeft.minutes}</strong>m
          </span>
          <span className="bg-black/35 backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 shadow-xs">
            <strong className="text-amber-300 text-sm">{timeLeft.seconds}</strong>s
          </span>
        </div>
      </div>

      {/* Hero Section with Liquid Glass Atmosphere */}
      <section className="relative min-h-[85vh] bg-canvas flex flex-col justify-center items-center text-center py-24 px-6 overflow-hidden">
        {/* Multi-layered Ambient Light Reflections */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,102,204,0.14),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.1),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08),transparent_50%)]" />

        <div className="max-w-[960px] w-full flex flex-col items-center gap-7 z-10">
          {/* Liquid Glass Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl text-primary dark:text-blue-300 text-xs font-semibold rounded-full border border-white/60 dark:border-white/15 shadow-md shadow-blue-500/5 animate-fade-in hover:scale-[1.02] transition-transform cursor-pointer">
            <Trophy className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span>Nền tảng Ôn luyện THPT Quốc Gia Chuẩn Cấu Trúc Bộ GD&amp;ĐT</span>
            <ChevronRight className="h-3.5 w-3.5 text-primary/70 opacity-70" />
          </div>

          {/* Main Title with Radiant Gradient */}
          <h1 className="font-hero-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-ink font-extrabold leading-[1.08] max-w-[900px]">
            Luyện Thi Thông Minh. <br />
            <span className="bg-gradient-to-r from-blue-600 via-primary to-indigo-600 bg-clip-text text-transparent drop-shadow-xs">
              Đỗ Nguyện Vọng 1.
            </span>
          </h1>

          {/* Lead Paragraph */}
          <p className="font-lead text-base sm:text-xl md:text-2xl text-ink-muted-80 max-w-[720px] leading-relaxed font-body font-normal">
            Học sâu hiểu bản chất, thực chiến làm đề thi thử chuẩn ma trận minh họa. Hệ thống tráo đề thông minh của <strong className="text-primary font-bold">EduWeb</strong> cam kết mang lại bứt phá điểm số tối ưu cho mục tiêu đại học mơ ước.
          </p>

          {/* Liquid Glass Interactive Action Buttons */}
          <div className="flex items-center gap-4 mt-4 flex-wrap justify-center w-full max-w-[500px]">
            <Link
              href="/admission"
              className="flex-1 min-w-[210px] bg-primary hover:bg-primary-focus text-white px-8 py-4 rounded-full font-body font-semibold apple-active-scale transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 border border-white/20 flex items-center justify-center gap-2 text-sm sm:text-base group"
            >
              Đăng ký học thử miễn phí
              <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/quizzes"
              className="flex-1 min-w-[190px] bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/15 hover:border-primary text-ink hover:text-primary px-8 py-4 rounded-full font-body font-semibold text-sm sm:text-base apple-active-scale transition-all duration-300 shadow-md flex items-center justify-center gap-2"
            >
              <Play className="h-4.5 w-4.5 fill-current text-primary" /> Thi thử Demo ngay
            </Link>
          </div>
        </div>

        {/* Dynamic Bento Stats Grid with Glassmorph Cards */}
        <div className="max-w-[1140px] w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 z-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl shadow-blue-500/5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 text-left flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <StitchIconBadge icon={stat.icon} variant={stat.variant} size="md" />
                <span className="text-[10px] font-bold text-ink-muted-48 uppercase tracking-widest bg-white/60 dark:bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/40 dark:border-white/10">
                  Hệ thống EduWeb
                </span>
              </div>
              <div className="mt-6">
                <p className="text-3xl sm:text-4xl font-extrabold text-ink font-tagline group-hover:text-primary transition-colors tracking-tight">
                  {stat.value}
                </p>
                <h4 className="font-body-strong text-sm sm:text-base font-semibold text-ink mt-1.5">
                  {stat.label}
                </h4>
                <p className="text-xs text-ink-muted-48 mt-1">{stat.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="bg-canvas-parchment/60 backdrop-blur-md py-28 px-6 border-t border-hairline relative">
        <div className="max-w-[1140px] mx-auto flex flex-col gap-16">
          <div className="text-center max-w-[680px] mx-auto flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 bg-blue-500/10 dark:bg-blue-400/10 rounded-full border border-primary/20 w-fit mx-auto">
              Tính năng vượt trội
            </span>
            <h2 className="font-display-lg text-3xl sm:text-5xl font-bold text-ink leading-tight tracking-tight">
              Giải Pháp Ôn Thi Toàn Diện Cho Học Sinh THPT
            </h2>
            <p className="font-caption text-ink-muted-80 text-base leading-relaxed">
              Kết hợp công nghệ đảo đề thi tự động, ngân hàng câu hỏi bám sát ma trận Bộ GD&amp;ĐT cùng giao diện trải nghiệm mượt mà.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-8 shadow-xl shadow-slate-500/5 hover:shadow-2xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between gap-6 group"
              >
                <div className="flex items-start gap-5">
                  <StitchIconBadge icon={feat.icon} variant={feat.variant} size="lg" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {feat.badge}
                    </span>
                    <h3 className="font-body-strong text-xl font-bold text-ink group-hover:text-primary transition-colors">
                      {feat.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-ink-muted-80 font-body leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Exam Interactive Preview Section with Liquid Glass Window */}
      <section className="bg-canvas text-ink py-28 px-6 border-t border-hairline relative">
        <div className="max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="flex flex-col gap-7 text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/20 w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>Giao Diện Thi Thử Thực Chiến</span>
            </div>
            <h2 className="font-display-lg text-3xl sm:text-5xl font-bold text-ink leading-tight tracking-tight">
              Trải Nghiệm Phòng Thi Online Như Thi Thật
            </h2>
            <p className="text-base text-ink-muted-80 font-body leading-relaxed">
              Không chỉ xem lý thuyết thụ động, học sinh được bấm giờ làm đề thi trắc nghiệm trực tuyến, chấm điểm tức thì và phân tích phổ điểm chi tiết.
            </p>

            <div className="flex flex-col gap-3.5 text-sm text-ink-muted-80 font-body">
              <div className="flex items-center gap-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span><strong>Hệ thống tự động thu bài</strong> chính xác khi hết thời gian đếm ngược.</span>
              </div>
              <div className="flex items-center gap-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span><strong>Hỗ trợ công thức Toán LaTeX</strong> hiển thị sắc nét trên cả máy tính &amp; điện thoại.</span>
              </div>
              <div className="flex items-center gap-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span><strong>Bảng xếp hạng thi đua</strong> tự động cập nhật thứ hạng bài làm sau khi nộp.</span>
              </div>
            </div>

            <div className="mt-3">
              <Link
                href="/quizzes"
                className="bg-primary hover:bg-primary-focus text-white px-7 py-3.5 rounded-full text-sm font-semibold apple-active-scale transition-all duration-300 shadow-md shadow-blue-500/20 inline-flex items-center gap-2.5 w-fit"
              >
                Vào Ngân Hàng Đề Thi <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>

          {/* Interactive Mock Quiz Window with Liquid Glass Shell */}
          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/60 dark:border-white/15 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-4 border-b border-divider-soft">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-red-400/90 shadow-xs"></span>
                <span className="h-3.5 w-3.5 rounded-full bg-amber-400/90 shadow-xs"></span>
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-400/90 shadow-xs"></span>
                <span className="text-xs font-mono text-ink-muted-48 ml-3 hidden sm:inline-block">
                  eduweb.vn/quizzes/exam-2027
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Đang Thi Thử Live
              </span>
            </div>

            <div className="bg-canvas-parchment/80 backdrop-blur-md p-6 rounded-2xl border border-hairline flex flex-col gap-5">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-ink-muted-80 border-b border-divider-soft pb-4">
                <span>Đề thi thử Toán THPT 2027 • Mã đề: <strong className="text-primary font-mono">MD-8421</strong></span>
                <span className="text-primary font-mono font-bold flex items-center gap-1.5 bg-blue-500/10 px-3 py-1 rounded-full border border-primary/20">
                  <Clock className="h-4 w-4" /> 48:20
                </span>
              </div>

              <div className="text-left flex flex-col gap-4">
                <p className="text-sm sm:text-base font-bold text-ink leading-relaxed">
                  Câu 15: Cho hàm số f(x) có bảng biến thiên như hình vẽ. Hỏi giá trị cực đại của hàm số là bao nhiêu?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 border-2 border-primary bg-primary/10 text-primary font-semibold rounded-2xl flex items-center justify-between cursor-pointer shadow-xs">
                    <span>A. y = 3</span>
                    <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="p-3.5 border border-hairline bg-white dark:bg-slate-800/60 text-ink rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                    <span>B. y = -1</span>
                  </div>
                  <div className="p-3.5 border border-hairline bg-white dark:bg-slate-800/60 text-ink rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                    <span>C. y = 0</span>
                  </div>
                  <div className="p-3.5 border border-hairline bg-white dark:bg-slate-800/60 text-ink rounded-2xl cursor-pointer hover:border-primary/50 transition-colors">
                    <span>D. y = 2</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-divider-soft pt-4 flex justify-between items-center text-xs sm:text-sm">
                <span className="text-ink-muted-48">Đã làm: <strong>15 / 50</strong> câu</span>
                <button
                  type="button"
                  className="bg-primary hover:bg-primary-focus text-white text-xs sm:text-sm px-5 py-2 rounded-full font-semibold shadow-md transition-colors"
                >
                  Nộp bài ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subject Categories Showcase */}
      <section className="bg-canvas-parchment/60 backdrop-blur-md py-28 px-6 border-t border-hairline">
        <div className="max-w-[1140px] mx-auto flex flex-col gap-14 text-center">
          <div className="max-w-[640px] mx-auto flex flex-col gap-3.5">
            <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 bg-blue-500/10 rounded-full border border-primary/20 w-fit mx-auto">
              Môn học trọng tâm
            </span>
            <h2 className="font-display-lg text-3xl sm:text-5xl font-bold text-ink tracking-tight">
              Các Khối Thi &amp; Chuyên Đề Tốt Nghiệp
            </h2>
            <p className="font-caption text-ink-muted-80 text-base">
              Đầy đủ ngân hàng câu hỏi ôn luyện theo từng khối xét tuyển Đại học (A00, A01, B00, C00, D01).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {subjects.map((sub) => (
              <Link
                key={sub.name}
                href="/quizzes"
                className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center text-center gap-3.5 hover:border-primary hover:scale-105 transition-all duration-300 group shadow-lg shadow-blue-500/5"
              >
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center text-3xl shadow-inner`}>
                  {sub.icon}
                </div>
                <div>
                  <h3 className="font-body-strong text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {sub.name}
                  </h3>
                  <span className="text-xs font-semibold text-ink-muted-48 block mt-1">
                    {sub.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section with Radiant Glass Card */}
      <section className="bg-gradient-to-b from-canvas-parchment/60 to-canvas text-ink py-28 px-6 border-t border-hairline text-center">
        <div className="max-w-[820px] mx-auto bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/70 dark:border-white/15 rounded-3xl p-10 sm:p-16 shadow-2xl shadow-blue-500/10 flex flex-col items-center gap-7 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,102,204,0.18),transparent_65%)]" />

          <div className="h-16 w-16 rounded-3xl bg-blue-500/10 text-primary flex items-center justify-center shadow-inner z-10 border border-primary/20">
            <Flame className="h-8 w-8 text-primary" />
          </div>

          <h2 className="font-display-lg text-3xl sm:text-5xl font-bold text-ink leading-tight tracking-tight z-10">
            Đừng Bỏ Lỡ Giai Đoạn Vàng Để Ôn Thi THPT Quốc Gia
          </h2>
          <p className="font-lead text-base sm:text-lg text-ink-muted-80 max-w-[600px] leading-relaxed font-body z-10">
            Đăng ký học thử miễn phí ngay hôm nay để trải nghiệm toàn bộ kho đề thi thử và nhận tài liệu ôn luyện VIP từ EduWeb.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full max-w-[440px] justify-center z-10">
            <Link
              href="/admission"
              className="flex-1 bg-primary hover:bg-primary-focus text-white px-8 py-4 rounded-full font-body font-semibold apple-active-scale transition-all duration-300 shadow-lg shadow-blue-500/25 text-sm sm:text-base flex items-center justify-center gap-2.5 border border-white/20"
            >
              Gửi Hồ Sơ Nhập Học Ngay <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>

          <p className="text-xs text-ink-muted-48 z-10">
            Miễn phí 100% tài liệu ôn thi ban đầu • Không yêu cầu thẻ tín dụng
          </p>
        </div>
      </section>
    </div>
  );
}
