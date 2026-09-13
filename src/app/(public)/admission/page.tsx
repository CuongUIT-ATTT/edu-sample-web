"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Home,
  MessageSquare,
  Route,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

const PATH_LABELS: Record<string, string> = {
  "but-pha-8-plus-thpt": "Lộ Trình Bứt Phá Điểm 8+ THPT Quốc Gia",
  "on-som-lop-10-11-vip": "Lộ Trình Ôn Sớm & Học Tốt 10 & 11 VIP",
  "90-ngay-ve-dich-cap-toc": "Chiến Dịch 90 Ngày Về Đích Cấp Tốc",
};

const PACKAGE_LABELS: Record<string, string> = {
  basic: "Gói Cơ Bản — 4 buổi / tháng",
  standard: "Gói Tiêu Chuẩn — 8 buổi / tháng",
  vip: "Gói VIP — 12 buổi / tháng (Phổ biến nhất)",
  intensive: "Gói Chuyên Sâu — 16 buổi / tháng",
};

const ADMISSION_STEPS = [
  "Gửi hồ sơ trực tuyến trong 2 phút",
  "Nhận lịch kiểm tra năng lực đầu vào",
  "Chốt lộ trình học và tài khoản LMS",
];

interface SubmittedAdmission {
  code: string;
  studentName: string;
  gradeLevel: string;
  submittedAt: string;
}

export default function AdmissionPage() {
  const [submittedAdmission, setSubmittedAdmission] = useState<SubmittedAdmission | null>(null);
  const [prefilledPath, setPrefilledPath] = useState<string | null>(null);
  const [prefilledPackage, setPrefilledPackage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathSlug = params.get("path");
    const packageSlug = params.get("package");

    setPrefilledPath(pathSlug ? PATH_LABELS[pathSlug] || pathSlug : null);
    setPrefilledPackage(packageSlug ? PACKAGE_LABELS[packageSlug] || packageSlug : null);
  }, []);

  const contextBadges = useMemo(() => {
    const badges = [];

    if (prefilledPath) {
      badges.push({
        label: "Lộ trình muốn tư vấn",
        value: prefilledPath,
        icon: Route,
        className: "bg-primary/10 text-primary border-primary/20",
      });
    }

    if (prefilledPackage) {
      badges.push({
        label: "Gói học quan tâm",
        value: prefilledPackage,
        icon: Zap,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      });
    }

    return badges;
  }, [prefilledPackage, prefilledPath]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const studentName = String(formData.get("name") || "Học viên");
    const gradeLevel = String(formData.get("grade") || "");

    setSubmittedAdmission({
      code: `EDU-${Date.now().toString().slice(-6)}`,
      studentName,
      gradeLevel,
      submittedAt: new Date().toLocaleString("vi-VN"),
    });
  };

  if (submittedAdmission) {
    return (
      <div className="relative bg-canvas min-h-screen py-12 px-4 sm:px-6 flex items-center justify-center overflow-hidden transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,204,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(34,197,94,0.12),transparent_50%)]" />

        <div className="relative z-10 max-w-[580px] w-full backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center gap-6 animate-fade-in">
          <div className="h-18 w-18 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shadow-inner border border-green-500/20">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> Hồ sơ đã được ghi nhận
            </p>
            <h1 className="font-display-lg text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Nộp đơn tuyển sinh thành công!
            </h1>
            <p className="font-body text-ink-muted-80 mt-2 text-sm leading-relaxed">
              EduWeb đã tiếp nhận hồ sơ xét tuyển trực tuyến và sẽ phản hồi lịch tư vấn trong thời gian sớm nhất.
            </p>
          </div>

          <div className="bg-canvas/60 dark:bg-slate-800/60 border border-hairline rounded-3xl p-5 w-full text-left flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-hairline/60 pb-3 text-xs">
              <span className="text-ink-muted-48 font-semibold">Mã hồ sơ</span>
              <span className="font-mono font-extrabold text-primary">{submittedAdmission.code}</span>
            </div>
            <div className="flex justify-between items-center text-xs gap-4">
              <span className="text-ink-muted-48 font-semibold">Học viên</span>
              <span className="font-bold text-ink text-right">{submittedAdmission.studentName}</span>
            </div>
            <div className="flex justify-between items-center text-xs gap-4">
              <span className="text-ink-muted-48 font-semibold">Khối lớp</span>
              <span className="font-bold text-ink">Khối Lớp {submittedAdmission.gradeLevel}</span>
            </div>
            {prefilledPath && (
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-ink-muted-48 font-semibold">Lộ trình</span>
                <span className="font-bold text-ink text-right max-w-[260px]">{prefilledPath}</span>
              </div>
            )}
            {prefilledPackage && (
              <div className="flex justify-between items-center text-xs gap-4">
                <span className="text-ink-muted-48 font-semibold">Gói học</span>
                <span className="font-bold text-primary text-right max-w-[260px]">{prefilledPackage}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs gap-4">
              <span className="text-ink-muted-48 font-semibold">Thời gian nhận</span>
              <span className="text-ink-muted-80 font-mono text-right">{submittedAdmission.submittedAt}</span>
            </div>
          </div>

          <div className="w-full text-left flex flex-col gap-4 border-t border-hairline/60 pt-5">
            <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider">Các bước tiếp theo</h3>
            {ADMISSION_STEPS.slice(1).map((step, index) => (
              <div key={step} className="flex gap-3 items-start text-xs text-ink-muted-80">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold mt-0.5 border border-primary/20">
                  {index + 1}
                </div>
                <p className="leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/15 text-ink hover:text-primary hover:border-primary/30 px-4 py-3 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm apple-active-scale"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              Nhóm hỗ trợ Zalo
            </a>
            <Link
              href="/"
              className="flex-1 bg-primary hover:bg-primary-focus text-white px-4 py-3 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 apple-active-scale"
            >
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-canvas min-h-screen py-12 px-4 sm:px-6 overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(0,102,204,0.14),transparent_48%),radial-gradient(circle_at_86%_12%,rgba(168,85,247,0.11),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.1),transparent_45%)]" />

      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-10 relative z-10">
        <aside className="flex flex-col gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-ink hover:text-primary bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 px-4 py-2 rounded-full backdrop-blur-lg shadow-sm apple-active-scale transition-all w-fit"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
            Trở về trang chủ
          </Link>

          <div className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <StitchIconBadge icon={UserRoundCheck} variant="blue" size="md" />
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full uppercase tracking-wider">
                Tuyển sinh 2026
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight">
                Đăng ký lộ trình học cá nhân hóa
              </h1>
              <p className="font-body text-ink-muted-80 text-sm sm:text-base leading-relaxed">
                Điền thông tin xét tuyển để nhận tư vấn năng lực đầu vào, lịch học thử và tài khoản LMS EduWeb trong năm học 2026 - 2027.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {ADMISSION_STEPS.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl bg-canvas/60 dark:bg-slate-800/60 border border-hairline/60 px-4 py-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-extrabold">
                    {index + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-ink">{step}</span>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-ink-muted-80 leading-relaxed">
                  Hồ sơ chỉ dùng cho tư vấn nội bộ. Ban tuyển sinh sẽ liên hệ qua điện thoại hoặc email trong vòng 4 giờ làm việc.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          {contextBadges.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {contextBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${badge.className}`}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider">{badge.label}</p>
                      <p className="text-xs font-bold text-ink mt-0.5">{badge.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {prefilledPath && <input type="hidden" name="interestedPath" value={prefilledPath} />}
            {prefilledPackage && <input type="hidden" name="interestedPackage" value={prefilledPackage} />}

            <div className="grid grid-cols-1 gap-2">
              <label className="font-caption-strong text-ink text-xs font-bold">Họ và tên học viên *</label>
              <input
                type="text"
                name="name"
                placeholder="Nguyễn Văn A"
                className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-caption-strong text-ink text-xs font-bold">Ngày sinh *</label>
                <input
                  type="date"
                  name="dob"
                  className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-caption-strong text-ink text-xs font-bold">Khối lớp xét tuyển *</label>
                <select
                  name="grade"
                  className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full"
                  required
                >
                  <option value="">Chọn khối lớp</option>
                  <option value="10">Khối Lớp 10</option>
                  <option value="11">Khối Lớp 11</option>
                  <option value="12">Khối Lớp 12</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="font-caption-strong text-ink text-xs font-bold">Họ và tên phụ huynh / người giám hộ *</label>
              <input
                type="text"
                name="parentName"
                placeholder="Nguyễn Văn B"
                className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-caption-strong text-ink text-xs font-bold">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="0901234567"
                  className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-caption-strong text-ink text-xs font-bold">Email liên hệ *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="phuhuynh@example.com"
                  className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-ink text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="font-caption-strong text-ink text-xs font-bold">Ghi chú thêm về học viên</label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Năng lực hiện tại, mục tiêu điểm số, lịch học mong muốn..."
                className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-3xl px-5 py-4 text-ink text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full resize-none placeholder:text-ink-muted-48"
              />
            </div>

            <div className="flex items-start gap-3 mt-1 rounded-2xl bg-canvas/50 dark:bg-slate-800/50 border border-hairline/60 p-4">
              <input type="checkbox" id="agree" className="h-4 w-4 mt-0.5 rounded border-hairline text-primary focus:ring-primary-focus" required />
              <label htmlFor="agree" className="text-xs text-ink-muted-80 cursor-pointer select-none leading-relaxed">
                Tôi cam kết các thông tin khai báo trên là chính xác và đồng ý để EduWeb liên hệ tư vấn tuyển sinh.
              </label>
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary-focus hover:to-blue-700 text-white px-6 py-3.5 rounded-full font-body font-extrabold text-sm sm:text-base apple-active-scale transition-all shadow-xl shadow-primary/25 w-full mt-2 flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              Nộp đơn đăng ký tuyển sinh
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
