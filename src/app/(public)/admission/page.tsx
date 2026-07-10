"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Home, ArrowLeft, ClipboardCheck, MessageSquare, Route, Zap } from "lucide-react";

// Map path slugs → human-readable labels
const PATH_LABELS: Record<string, string> = {
  "but-pha-8-plus-thpt": "Lộ Trình Bứt Phá Điểm 8+ THPT Quốc Gia",
  "on-som-lop-10-11-vip": "Lộ Trình Ôn Sớm & Học Tốt 10 & 11 VIP",
  "90-ngay-ve-dich-cap-toc": "Chiến Dịch 90 Ngày Về Đích Cấp Tốc",
};

// Map package slugs → human-readable labels
const PACKAGE_LABELS: Record<string, string> = {
  "basic": "Gói Cơ Bản — 4 buổi / tháng",
  "standard": "Gói Tiêu Chuẩn — 8 buổi / tháng",
  "vip": "Gói VIP — 12 buổi / tháng (Phổ biến nhất)",
  "intensive": "Gói Chuyên Sâu — 16 buổi / tháng",
};

// Server Component props from Next.js App Router (no useSearchParams needed)
interface AdmissionPageProps {
  searchParams: Promise<{ path?: string; package?: string }>;
}

export default function AdmissionPage({ searchParams }: AdmissionPageProps) {
  return <AdmissionForm searchParams={searchParams} />;
}

// Inner client component to access searchParams
function AdmissionForm({ searchParams }: AdmissionPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [admissionCode, setAdmissionCode] = useState("");

  // Read URL params directly on client — avoids Next.js 16 async searchParams timing issues
  const [prefilledPath, setPrefilledPath] = useState<string | null>(null);
  const [prefilledPackage, setPrefilledPackage] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathSlug = params.get("path");
    const pkgSlug = params.get("package");
    if (pathSlug && PATH_LABELS[pathSlug]) setPrefilledPath(PATH_LABELS[pathSlug]);
    else if (pathSlug) setPrefilledPath(pathSlug);
    if (pkgSlug && PACKAGE_LABELS[pkgSlug]) setPrefilledPackage(PACKAGE_LABELS[pkgSlug]);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const grade = formData.get("grade") as string;

    const randomCode = `EDU-${Date.now().toString().slice(-6)}`;
    setStudentName(name);
    setGradeLevel(grade);
    setAdmissionCode(randomCode);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-canvas-parchment min-h-screen py-16 px-6 flex items-center justify-center">
        <div className="max-w-[550px] w-full bg-canvas border border-hairline rounded-lg p-8 md:p-10 shadow-product flex flex-col items-center text-center gap-6 animate-fade-in">

          <div className="h-16 w-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <div>
            <h1 className="font-display-lg text-2xl font-bold text-ink">Nộp Đơn Tuyển Sinh Thành Công!</h1>
            <p className="font-caption text-ink-muted-80 mt-2 text-xs">
              Hệ thống đã tiếp nhận hồ sơ xét tuyển trực tuyến của học viên.
            </p>
          </div>

          {/* Admission summary card */}
          <div className="bg-surface-pearl border border-divider-soft rounded-lg p-5 w-full text-left flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-divider-soft pb-2 text-xs">
              <span className="text-ink-muted-48">Mã hồ sơ:</span>
              <span className="font-mono font-bold text-primary">{admissionCode}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted-48">Học viên xét tuyển:</span>
              <span className="font-bold text-ink">{studentName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted-48">Khối lớp đăng ký:</span>
              <span className="font-bold text-ink">Khối Lớp {gradeLevel}</span>
            </div>
            {prefilledPath && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted-48">Lộ trình quan tâm:</span>
                <span className="font-bold text-ink text-right max-w-[240px]">{prefilledPath}</span>
              </div>
            )}
            {prefilledPackage && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted-48">Gói học mong muốn:</span>
                <span className="font-bold text-primary text-right max-w-[240px]">{prefilledPackage}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted-48">Thời gian nhận:</span>
              <span className="text-ink-muted-80 font-mono">{new Date().toLocaleString("vi-VN")}</span>
            </div>
          </div>

          {/* Next steps */}
          <div className="w-full text-left flex flex-col gap-4 border-t border-divider-soft pt-4">
            <h3 className="font-body-strong text-xs font-bold text-ink uppercase tracking-wider">Các bước tiếp theo cần làm</h3>
            <div className="flex gap-3 items-start text-xs text-ink-muted-80">
              <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">1</div>
              <p>Kiểm tra hộp thư điện tử (email) để nhận chi tiết lịch hẹn phỏng vấn kiểm tra năng lực đầu vào.</p>
            </div>
            <div className="flex gap-3 items-start text-xs text-ink-muted-80">
              <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">2</div>
              <p>Tham gia nhóm Zalo định hướng tuyển sinh để nhận tư vấn trực tiếp từ ban tuyển sinh.</p>
            </div>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-surface-pearl border border-divider-soft text-ink-muted-80 hover:text-ink hover:bg-divider-soft px-4 py-2.5 rounded-pill font-body font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Nhóm Hỗ Trợ Zalo
            </a>
            <Link
              href="/"
              className="flex-1 bg-primary hover:bg-primary-focus text-white px-4 py-2.5 rounded-pill font-body font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Home className="h-4 w-4" />
              Trang Chủ
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[600px] mx-auto bg-canvas border border-hairline rounded-lg p-8 md:p-12 shadow-product">

        {/* Header */}
        <div className="flex flex-col gap-3 text-center mb-8">
          <Link href="/" className="flex items-center gap-1 text-primary hover:underline text-xs font-semibold self-center mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Trở về trang chủ
          </Link>
          <h1 className="font-display-lg text-3xl font-semibold text-ink">Đăng Ký Tuyển Sinh Trực Tuyến</h1>
          <p className="font-caption text-ink-muted-80">
            Điền thông tin để thực hiện nộp hồ sơ xét tuyển nhanh chóng năm học 2026 - 2027.
          </p>
        </div>

        {/* Pre-filled context badges */}
        {(prefilledPath || prefilledPackage) && (
          <div className="flex flex-col gap-2 mb-6">
            {prefilledPath && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <Route className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Lộ trình muốn tư vấn</p>
                  <p className="text-xs font-semibold text-ink mt-0.5">{prefilledPath}</p>
                </div>
              </div>
            )}
            {prefilledPackage && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <Zap className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Gói học quan tâm</p>
                  <p className="text-xs font-semibold text-ink mt-0.5">{prefilledPackage}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admission Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Hidden fields to carry context through submit */}
          {prefilledPath && <input type="hidden" name="interestedPath" value={prefilledPath} />}
          {prefilledPackage && <input type="hidden" name="interestedPackage" value={prefilledPackage} />}

          <div className="flex flex-col gap-2">
            <label className="font-caption-strong text-ink text-xs">Họ và tên học viên đăng ký *</label>
            <input
              type="text"
              name="name"
              placeholder="Nguyễn Văn A"
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Ngày sinh *</label>
              <input
                type="date"
                name="dob"
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Khối lớp xét tuyển *</label>
              <select
                name="grade"
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
                required
              >
                <option value="">Chọn khối lớp</option>
                <option value="10">Khối Lớp 10</option>
                <option value="11">Khối Lớp 11</option>
                <option value="12">Khối Lớp 12</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-caption-strong text-ink text-xs">Họ và tên phụ huynh / người giám hộ *</label>
            <input
              type="text"
              name="parentName"
              placeholder="Nguyễn Văn B"
              className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Số điện thoại liên hệ *</label>
              <input
                type="tel"
                name="phone"
                placeholder="0901234567"
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-caption-strong text-ink text-xs">Email liên hệ *</label>
              <input
                type="email"
                name="email"
                placeholder="phuhuynh@example.com"
                className="bg-canvas border border-hairline rounded-pill px-5 py-2.5 h-11 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-caption-strong text-ink text-xs">Ghi chú thêm về học viên (năng khiếu, sức khỏe...)</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Ghi chú tại đây..."
              className="bg-canvas border border-hairline rounded-lg px-5 py-3 text-ink text-sm outline-none focus:border-primary-focus transition-colors w-full resize-none"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="agree" className="h-4 w-4 rounded border-hairline text-primary focus:ring-primary-focus" required />
            <label htmlFor="agree" className="text-xs text-ink-muted-80 cursor-pointer select-none">
              Tôi cam kết các thông tin khai báo trên là chính xác và hoàn toàn chịu trách nhiệm.
            </label>
          </div>

          <button
            type="submit"
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="h-4 w-4" />
            Nộp đơn đăng ký tuyển sinh
          </button>
        </form>

      </div>
    </div>
  );
}
