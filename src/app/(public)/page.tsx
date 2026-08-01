"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Trophy, BookOpen, Clock, Users, Play, Heart, Star, StarHalf } from "lucide-react";

import { getSystemStats } from "@/actions/quizzes";

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
      const res = await getSystemStats();
      if (res.success && res.data) {
        setRealStats(res.data);
      }
      setLoadingStats(false);
    };
    fetchStats();

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: loadingStats ? "..." : `${realStats.totalQuizzes}`, label: "Đề thi thử trực tuyến" },
    { value: loadingStats ? "..." : `${realStats.totalStudents}`, label: "Học viên đã đăng ký" },
    { value: loadingStats ? "..." : `${realStats.totalCourses}`, label: "Khóa học chính thức" },
    { value: loadingStats ? "..." : `${realStats.totalSubmissions}`, label: "Lượt làm bài nộp tích lũy" },
  ];



  return (
    <div className="flex flex-col w-full overflow-hidden bg-canvas-parchment">
      
      {/* Countdown Sticky Notification */}
      <div className="bg-primary text-white py-2 px-6 text-center text-xs font-semibold select-none flex items-center justify-center gap-2 flex-wrap shadow-md">
        <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
        <span>Đếm ngược Kỳ thi Tốt nghiệp THPT Quốc Gia 2027:</span>
        <div className="flex gap-1.5 font-mono text-[13px] bg-primary-focus px-2 py-0.5 rounded border border-white/20">
          <span><strong>{timeLeft.days}</strong> ngày</span>
          <span><strong>{timeLeft.hours}</strong> giờ</span>
          <span><strong>{timeLeft.minutes}</strong> phút</span>
          <span><strong>{timeLeft.seconds}</strong> giây</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="min-h-[80vh] bg-canvas text-ink flex flex-col justify-center items-center text-center py-16 px-6 relative">
        <div className="max-w-[850px] w-full flex flex-col items-center gap-4 mt-8 z-10">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-primary text-xs font-semibold rounded-full border border-blue-200">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Hệ thống luyện thi THPT chất lượng cao
          </span>
          <h1 className="font-hero-display text-4xl md:text-6xl tracking-tight text-ink font-bold mt-2 leading-tight">
            Luyện Thi Thông Minh. <br />Đỗ Nguyện Vọng 1.
          </h1>
          <p className="font-lead text-base md:text-lg text-ink-muted-80 max-w-[640px] mt-4 leading-relaxed font-body">
            Học sâu hiểu bản chất, thực chiến luyện đề thi thử bám sát đề minh họa. Hệ thống ôn luyện của <strong>EduWeb</strong> cam kết mang lại bứt phá điểm số tối ưu cho mục tiêu đại học của bạn.
          </p>
          <div className="flex items-center gap-4 mt-8 flex-wrap justify-center">
            <Link 
              href="/admission" 
              className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm flex items-center gap-2 text-xs"
            >
              Đăng ký học thử miễn phí <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/quizzes" 
              className="bg-surface-pearl border border-divider-soft text-primary hover:bg-divider-soft px-6 py-3 rounded-pill font-body font-semibold text-xs apple-active-scale transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 fill-current text-primary" /> Thi thử Demo ngay
            </Link>
          </div>
        </div>

        {/* Social Proof Statistics */}
        <div className="max-w-[980px] w-full grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 z-10">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-primary font-tagline">{stat.value}</p>
              <p className="text-[11px] text-ink-muted-80 mt-1 font-body">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video Platform Showcase (tyhh.net style) */}
      <section className="bg-canvas-parchment text-ink flex flex-col items-center justify-center py-20 px-6 border-t border-hairline">
        <div className="max-w-[980px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-5 text-left">
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Hệ sinh thái luyện đề</span>
            <h2 className="font-display-lg text-3xl font-bold text-ink leading-tight">
              Hệ Thống Luyện Đề Tương Tác Hiện Đại
            </h2>
            <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
              Không chỉ học thụ động qua video, học viên được thực chiến làm đề trắc nghiệm chấm điểm tự động, xem biểu đồ phân tích phổ điểm lý thuyết vs vận dụng, tham gia bảng xếp hạng thi đua nhận học bổng tháng.
            </p>
            <ul className="flex flex-col gap-3 text-xs text-ink-muted-80 font-body">
              <li className="flex gap-2 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                <span>Hơn 2,500 đề thi thử được phân loại theo từng khối lớp và chuyên đề.</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                <span>Lời giải chi tiết bằng văn bản kèm livestream sửa bài trực tiếp.</span>
              </li>
              <li className="flex gap-2 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                <span>Bộ đếm lượt thi và lưu trữ kết quả học tập so sánh tiến độ.</span>
              </li>
            </ul>
            <div className="mt-2">
              <Link href="/courses" className="text-primary hover:underline text-xs font-semibold inline-flex items-center gap-1">
                Khám phá kho khóa học <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-lg shadow-product overflow-hidden p-3 aspect-[16/10] flex flex-col">
            <div className="flex items-center gap-1.5 pb-2 border-b border-divider-soft">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-green-400"></span>
              <span className="text-[10px] text-ink-muted-48 ml-4 font-mono">eduweb.vn/quizzes</span>
            </div>
            <div className="flex-grow bg-canvas-parchment flex flex-col justify-between p-4 rounded-sm">
              <div className="border-b border-divider-soft pb-2 flex justify-between items-center text-[10px] font-bold text-ink-muted-48">
                <span>Câu hỏi 15 / 50</span>
                <span className="text-primary">Đếm ngược: 42:15</span>
              </div>
              <div className="py-2 text-left">
                <p className="text-[11px] font-bold text-ink">Cho log_a(b) = 3. Tính giá trị biểu thức P = log_(a^2)(b^3)?</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                  <span className="p-2 border border-primary bg-blue-50/50 text-primary rounded font-semibold">A. P = 4.5</span>
                  <span className="p-2 border border-divider-soft bg-canvas rounded">B. P = 2.0</span>
                  <span className="p-2 border border-divider-soft bg-canvas rounded">C. P = 9.0</span>
                  <span className="p-2 border border-divider-soft bg-canvas rounded">D. P = 1.5</span>
                </div>
              </div>
              <div className="border-t border-divider-soft pt-2 flex justify-end">
                <span className="bg-primary text-white text-[9px] px-3 py-1 rounded font-semibold">Nộp bài ôn tập</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA final Section */}
      <section className="bg-canvas-parchment text-ink flex flex-col items-center justify-center py-20 px-6 text-center border-t border-hairline">
        <div className="max-w-[760px] w-full flex flex-col items-center gap-6">
          <h2 className="font-display-lg text-3xl font-bold text-ink">
            Đừng Bỏ Lỡ Giai Đoạn Vàng Để Luyện Thi THPT
          </h2>
          <p className="font-lead text-xs md:text-sm text-ink-muted-80 max-w-[550px] leading-relaxed font-body">
            Gửi đơn đăng ký tuyển sinh học thử miễn phí ngay hôm nay để nhận tài liệu VIP độc quyền giải mã đề thi thử THPT Quốc Gia từ EduWeb.
          </p>
          <div className="flex gap-4 mt-4 w-full justify-center">
            <Link 
              href="/admission" 
              className="bg-primary hover:bg-primary-focus text-white px-8 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm text-xs"
            >
              Gửi Hồ Sơ Nhập Học Ngay
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
