import React from "react";
import { FileText, Download } from "lucide-react";

interface DocItem {
  title: string;
  category: string;
  fileSize: string;
  url: string;
  downloads: number;
}

export default function DocumentsPage() {
  const documents: DocItem[] = [
    {
      title: "Sổ tay tóm tắt công thức giải nhanh Toán THPT Quốc Gia",
      category: "Toán học",
      fileSize: "1.2 MB",
      url: "/docs/viet-theorem.pdf",
      downloads: 1420,
    },
    {
      title: "Sơ đồ tư duy ôn thi Lý thuyết dòng điện xoay chiều",
      category: "Vật lý",
      fileSize: "980 KB",
      url: "/docs/substitution-methods.pdf",
      downloads: 856,
    },
  ];

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-12">

        {/* Header */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Kho Tài Liệu
          </span>
          <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
            Tài Liệu Ôn Thi &amp; Tóm Tắt Lý Thuyết
          </h1>
          <p className="font-lead text-ink-muted-80 text-sm max-w-[620px] leading-relaxed mt-1">
            Tải về hệ thống tài liệu biên soạn của EduWeb giúp rút ngắn thời gian ôn thi, ghi nhớ sâu công thức cốt lõi.
          </p>
        </div>

        {/* ── Free Documents ── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-body-strong text-sm font-bold text-ink uppercase tracking-wider">
              Tải ngay — Miễn phí
            </h2>
            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase">
              Không cần đăng nhập
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <div key={doc.title} className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-11 w-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-ink-muted-48">{doc.category}</span>
                    <h3 className="font-body-strong text-sm font-bold text-ink leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-[10px] text-ink-muted-80 font-body">
                      Dung lượng: {doc.fileSize} • {doc.downloads} lượt tải
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <a
                    href={doc.url}
                    download
                    className="h-9 w-9 rounded-full bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center border border-blue-200 transition-colors shadow-sm"
                    title="Tải tài liệu miễn phí"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
