"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

const CONTACT_METHODS = [
  {
    label: "Hotline tư vấn",
    value: "1900 1234",
    note: "Hỗ trợ từ 8:00 - 21:30 hàng ngày",
    icon: Phone,
    tone: "text-primary bg-primary/10 border-primary/20",
  },
  {
    label: "Hòm thư điện tử",
    value: "tuyensinh@eduweb.vn",
    note: "Giải đáp chuyên môn & tài liệu",
    icon: Mail,
    tone: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
  },
  {
    label: "Trụ sở chính",
    value: "Số 14 Cầu Giấy, Hà Nội",
    note: "EduWeb Campus - khu tư vấn tuyển sinh",
    icon: MapPin,
    tone: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

export default function ContactPage() {
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmittedName(String(formData.get("name") || "bạn"));
  };

  return (
    <div className="relative bg-canvas min-h-screen py-12 px-4 sm:px-6 overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,102,204,0.14),transparent_48%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.11),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.1),transparent_45%)]" />

      <div className="max-w-[1100px] mx-auto flex flex-col gap-10 relative z-10">
        <section className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-5 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StitchIconBadge icon={MessageCircle} variant="blue" size="md" />
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full uppercase tracking-wider">
                Liên hệ EduWeb
              </span>
            </div>
            <Link
              href="/admission"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary-focus px-4 py-2 rounded-full shadow-lg shadow-primary/25 apple-active-scale transition-all"
            >
              Đăng ký tuyển sinh
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="max-w-[720px]">
            <h1 className="font-display-lg text-3xl sm:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Đồng hành cùng học viên và phụ huynh 24/7
            </h1>
            <p className="font-body text-ink-muted-80 text-sm sm:text-base leading-relaxed mt-4">
              Gửi thắc mắc về lịch học, học phí hoặc đăng ký kiểm tra năng lực đầu vào. Ban tư vấn EduWeb sẽ phản hồi trong 4 giờ làm việc.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <aside className="lg:col-span-2 flex flex-col gap-6">
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
              <h2 className="font-tagline text-xl font-extrabold text-ink">Kênh hỗ trợ chính thức</h2>
              {CONTACT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.label} className="flex gap-4 items-start rounded-2xl bg-canvas/60 dark:bg-slate-800/60 border border-hairline/60 p-4">
                    <div className={`h-10 w-10 rounded-full border flex items-center justify-center flex-shrink-0 ${method.tone}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-ink">{method.label}</h3>
                      <p className="text-sm font-extrabold text-primary mt-0.5">{method.value}</p>
                      <p className="text-[11px] text-ink-muted-48 mt-1 leading-relaxed">{method.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl overflow-hidden shadow-xl h-[280px] relative flex flex-col justify-between">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.924403328514!2d105.80120157597148!3d21.031709480617387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab424a50fff9%3A0xbe8c460029b9e5d4!2zMTQgQ-G6p3UgR2nhuqV5LCBRdWFuIEhvYSwgQ-G6p3UgR2nhuqV5LCBIw6AgTuG7mWksIFZp4buZdCBOYW0!5e0!3m2!1svi!2s!4v1710000000000!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full opacity-80"
                title="Bản đồ cơ sở EduWeb Cầu Giấy"
              />
              <div className="relative z-10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl text-ink p-4 rounded-2xl border border-white/60 dark:border-white/15 shadow-lg w-[90%] mx-auto mb-4 mt-auto flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Cơ sở Cầu Giấy</p>
                  <p className="text-xs text-ink-muted-80 font-bold mt-0.5">EduWeb Campus</p>
                </div>
                <a
                  href="https://maps.google.com/?q=14+Cau+Giay+Hanoi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-primary-focus text-white text-[10px] px-3 py-2 rounded-full font-extrabold transition-all whitespace-nowrap apple-active-scale"
                >
                  Xem bản đồ
                </a>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {submittedName ? (
              <div className="flex flex-col items-center text-center gap-6 py-10 animate-fade-in">
                <div className="h-16 w-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20 shadow-inner">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-extrabold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                    <Sparkles className="h-3.5 w-3.5" /> Đã gửi yêu cầu
                  </p>
                  <h2 className="font-tagline text-2xl font-extrabold text-ink">Yêu cầu tư vấn đã được gửi!</h2>
                  <p className="text-sm text-ink-muted-80 mt-3 max-w-[420px] leading-relaxed">
                    Cảm ơn <strong>{submittedName}</strong> đã liên hệ. Đội ngũ tuyển sinh EduWeb sẽ gọi điện hoặc gửi email tư vấn chi tiết cho bạn sớm nhất.
                  </p>
                </div>
                <button
                  onClick={() => setSubmittedName(null)}
                  className="border border-white/60 dark:border-white/15 bg-white/70 dark:bg-slate-800/70 hover:border-primary/30 text-ink hover:text-primary text-xs px-5 py-3 rounded-full font-bold transition-all apple-active-scale"
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="border-b border-hairline/60 pb-5">
                  <h2 className="font-tagline text-2xl font-extrabold text-ink">Gửi tin nhắn tư vấn</h2>
                  <p className="text-xs text-ink-muted-80 mt-2">Thông tin của bạn được bảo mật và chỉ dùng cho mục đích hỗ trợ học tập.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-extrabold text-ink">Họ và tên *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nguyễn Văn A"
                    className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-ink">Số điện thoại *</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="0901234567"
                      className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-ink">Email liên hệ</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="example@gmail.com"
                      className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full placeholder:text-ink-muted-48"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-extrabold text-ink">Chủ đề cần tư vấn *</label>
                  <select
                    name="subject"
                    className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-3 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full"
                    required
                  >
                    <option value="Lộ trình lớp 12 VIP">Lộ trình ôn thi tốt nghiệp THPT VIP 12</option>
                    <option value="Lớp 10 & 11 bứt phá">Khóa học bứt phá điểm số lớp 10, 11</option>
                    <option value="Đăng ký thi thử đánh giá năng lực">Đăng ký làm bài kiểm tra đánh giá năng lực</option>
                    <option value="Khác">Các câu hỏi khác</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-extrabold text-ink">Nội dung câu hỏi *</label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Nhập nội dung thắc mắc của bạn..."
                    className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-3xl px-5 py-4 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all w-full resize-none placeholder:text-ink-muted-48"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary-focus hover:to-blue-700 text-white px-6 py-3.5 rounded-full font-body font-extrabold text-sm sm:text-base apple-active-scale transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="h-4 w-4" />
                  Gửi yêu cầu tư vấn
                </button>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
