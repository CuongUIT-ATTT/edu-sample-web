import React from "react";
import { FileText, Download, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DocItem {
  title: string;
  category: string;
  fileSize: string;
  url: string;
  isVip: boolean;
  downloads: number;
}

export default function DocumentsPage() {
  const documents: DocItem[] = [
    {
      title: "Sổ tay tóm tắt công thức giải nhanh Toán THPT Quốc Gia",
      category: "Toán học",
      fileSize: "1.2 MB",
      url: "/docs/viet-theorem.pdf",
      isVip: false,
      downloads: 1420,
    },
    {
      title: "Sơ đồ tư duy ôn thi Lý thuyết dòng điện xoay chiều",
      category: "Vật lý",
      fileSize: "980 KB",
      url: "/docs/substitution-methods.pdf",
      isVip: false,
      downloads: 856,
    },
    {
      title: "Tập 10 đề thi thử tốt nghiệp THPT 2027 có giải chi tiết",
      category: "Toán học",
      fileSize: "4.5 MB",
      url: "/api/documents/vip/toan-thpt-2027-giaichitiet.pdf",
      isVip: true,
      downloads: 2108,
    },
    {
      title: "Đặc trị lỗi sai ngu lý thuyết Hóa học hữu cơ 12 (VIP)",
      category: "Hóa học",
      fileSize: "2.1 MB",
      url: "/api/documents/vip/hoa-huuco-chongsai-vip.pdf",
      isVip: true,
      downloads: 1680,
    },
  ];

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-12">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Kho Tài Liệu VIP
          </span>
          <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
            Tài Liệu Ôn Thi & Tóm Tắt Lý Thuyết
          </h1>
          <p className="font-lead text-ink-muted-80 text-sm max-w-[620px] leading-relaxed mt-1">
            Tải về hệ thống tài liệu biên soạn độc quyền của Thầy Hùng Cường giúp rút ngắn thời gian ôn thi, ghi nhớ sâu công thức cốt lõi.
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {documents.map((doc) => (
            <div key={doc.title} className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  doc.isVip ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-ink-muted-48">{doc.category}</span>
                    {doc.isVip && (
                      <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                        <Lock className="h-2 w-2" /> VIP
                      </span>
                    )}
                  </div>
                  <h3 className="font-body-strong text-sm font-bold text-ink leading-snug">
                    {doc.title}
                  </h3>
                  <p className="text-[10px] text-ink-muted-80 font-body">
                    Dung lượng: {doc.fileSize} • {doc.downloads} lượt tải
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {doc.isVip ? (
                  <Link
                    href="/login"
                    className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center border border-amber-200 transition-colors shadow-sm"
                    title="Yêu cầu tài khoản VIP"
                  >
                    <Lock className="h-4 w-4" />
                  </Link>
                ) : (
                  <a
                    href={doc.url}
                    download
                    className="h-8 w-8 rounded-full bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center border border-blue-200 transition-colors shadow-sm"
                    title="Tải tài liệu miễn phí"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Benefits banner */}
        <div className="bg-canvas border border-hairline rounded-lg p-8 md:p-12 shadow-product flex flex-col md:flex-row items-center justify-between gap-8 mt-6">
          <div className="flex flex-col gap-2 max-w-[500px]">
            <h3 className="font-tagline text-lg font-bold text-ink flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              Đặc quyền tài khoản học viên VIP
            </h3>
            <p className="text-xs text-ink-muted-80 font-body leading-relaxed">
              Trở thành học viên chính thức để tải hàng trăm đề thi thử tốt nghiệp THPT giải chi tiết, tóm tắt lý thuyết độc quyền và được hỗ trợ đáp án bài tập trực tuyến từ trợ giảng học tập.
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto flex-shrink-0">
            <Link
              href="/admission"
              className="bg-primary hover:bg-primary-focus text-white px-5 py-2.5 rounded-pill font-body font-semibold text-xs transition-colors text-center w-full md:w-auto flex items-center justify-center gap-1.5 shadow-sm"
            >
              Đăng ký nhập học VIP <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
