"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientName = formData.get("name") as string;
    setName(clientName);
    setSubmitted(true);
  };

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-12">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Liên hệ
          </span>
          <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
            Đồng Hành Cùng Bạn 24/7
          </h1>
          <p className="font-lead text-ink-muted-80 text-sm max-w-[600px] leading-relaxed mt-1">
            Gửi thắc mắc của bạn về lịch học, học phí hoặc đăng ký kiểm tra năng lực đầu vào. Ban tư vấn của EduWeb sẽ phản hồi bạn trong 4 giờ làm việc.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start mt-6">
          
          {/* Left panel: Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-6">
              <h3 className="font-tagline text-lg font-semibold text-ink border-b border-divider-soft pb-3">
                Thông tin liên hệ
              </h3>

              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-body-strong text-xs font-semibold text-ink">Hotline tư vấn</h4>
                  <p className="text-sm font-semibold text-primary mt-0.5">1900 1234</p>
                  <p className="text-[10px] text-ink-muted-48 mt-0.5">Hỗ trợ từ 8:00 - 21:30 hàng ngày</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-body-strong text-xs font-semibold text-ink">Hòm thư điện tử</h4>
                  <p className="text-xs text-ink mt-0.5">tuyensinh@eduweb.vn</p>
                  <p className="text-[10px] text-ink-muted-48 mt-0.5">Giải đáp chuyên môn & tài liệu</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-body-strong text-xs font-semibold text-ink">Trụ sở chính</h4>
                  <p className="text-xs text-ink mt-0.5 leading-relaxed">
                    Tòa nhà EduWeb, Số 14 Cầu Giấy, Quận Cầu Giấy, Hà Nội
                  </p>
                </div>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="bg-canvas border border-hairline rounded-lg overflow-hidden shadow-sm h-[250px] relative flex flex-col justify-between">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.924403328514!2d105.80120157597148!3d21.031709480617387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab424a50fff9%3A0xbe8c460029b9e5d4!2zMTQgQ-G6p3UgR2nhuqV5LCBRdWFuIEhvYSwgQ-G6p3UgR2nhuqV5LCBIw6AgTuG7mWksIFZp4buZdCBOYW0!5e0!3m2!1svi!2s!4v1710000000000!5m2!1svi!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              ></iframe>
              <div className="z-10 bg-canvas/95 backdrop-blur-sm text-ink p-3 rounded border border-hairline shadow-sm w-[92%] mx-auto mb-3 mt-auto flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase">Cơ sở Cầu Giấy</p>
                  <p className="text-xs text-ink-muted-80 font-semibold mt-0.5">EduWeb Campus</p>
                </div>
                <a 
                  href="https://maps.google.com/?q=14+Cau+Giay+Hanoi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-primary-focus text-white text-[10px] px-3 py-1.5 rounded-full font-bold transition-colors whitespace-nowrap"
                >
                  Xem Bản Đồ
                </a>
              </div>
            </div>
          </div>

          {/* Right panel: Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center text-center gap-6 py-8 animate-fade-in">
                  <div className="h-14 w-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-tagline text-xl font-bold text-ink">Yêu cầu đã được gửi!</h3>
                    <p className="text-xs text-ink-muted-80 mt-2 max-w-[360px]">
                      Cảm ơn <strong>{name}</strong> đã liên hệ. Đội ngũ tư vấn tuyển sinh của EduWeb sẽ gọi điện thoại hoặc gửi email tư vấn chi tiết cho bạn sớm nhất.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2 rounded-pill font-semibold transition-colors"
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <h3 className="font-tagline text-lg font-semibold text-ink border-b border-divider-soft pb-3 select-none">
                    Gửi tin nhắn tư vấn
                  </h3>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">Họ và tên *</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="Nguyễn Văn A" 
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus transition-colors w-full"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-caption-strong text-ink-muted-80">Số điện thoại *</label>
                      <input 
                        type="tel" 
                        name="phone"
                        placeholder="0901234567" 
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus transition-colors w-full"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-caption-strong text-ink-muted-80">Email liên hệ</label>
                      <input 
                        type="email" 
                        name="email"
                        placeholder="example@gmail.com" 
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus transition-colors w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">Chủ đề cần tư vấn *</label>
                    <select 
                      name="subject"
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus transition-colors w-full"
                      required
                    >
                      <option value="Lộ trình lớp 12 VIP">Lộ trình ôn thi tốt nghiệp THPT VIP 12</option>
                      <option value="Lớp 10 & 11 bứt phá">Khóa học bứt phá điểm số lớp 10, 11</option>
                      <option value="Đăng ký thi thử đánh giá năng lực">Đăng ký làm bài kiểm tra đánh giá năng lực</option>
                      <option value="Khác">Các câu hỏi khác</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">Nội dung câu hỏi *</label>
                    <textarea 
                      name="message"
                      rows={3}
                      placeholder="Nhập nội dung thắc mắc của bạn..." 
                      className="bg-canvas border border-hairline rounded-lg px-4 py-3 text-sm text-ink outline-none focus:border-primary-focus transition-colors w-full resize-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    <Send className="h-4 w-4" />
                    Gửi yêu cầu tư vấn
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
