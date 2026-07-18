import React from "react";
import { db } from "@/lib/db";
import { FileText, Download, Search, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kho Tài Liệu Ôn Thi | EduWeb",
  description: "Tải miễn phí tài liệu ôn thi, sơ đồ tư duy, sổ tay công thức được biên soạn bởi EduWeb.",
};

export default async function DocumentsPage() {
  const documents = await db.document.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  const byCategory: Record<string, typeof documents> = {};
  for (const doc of documents) {
    if (!byCategory[doc.category]) byCategory[doc.category] = [];
    byCategory[doc.category].push(doc);
  }

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
            Tải về miễn phí hệ thống tài liệu biên soạn của EduWeb giúp rút ngắn thời gian ôn thi, ghi nhớ sâu công thức cốt lõi.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
            <Search className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="text-sm text-ink-muted-80">
              Chưa có tài liệu nào. Vui lòng quay lại sau.
            </p>
          </div>
        ) : (
          Object.entries(byCategory).map(([category, docs]) => (
            <div key={category} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-body-strong text-sm font-bold text-ink uppercase tracking-wider">
                  {category}
                </h2>
                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase">
                  {docs.length} tài liệu
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileType === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-ink-muted-48">{doc.category}</span>
                        <h3 className="font-body-strong text-sm font-bold text-ink leading-snug">
                          {doc.title}
                        </h3>
                        {doc.description && (
                          <p className="text-[11px] text-ink-muted-80 line-clamp-2">{doc.description}</p>
                        )}
                        <p className="text-[10px] text-ink-muted-80 font-body">
                          {doc.fileType.toUpperCase()}{doc.fileSize ? ` • ${doc.fileSize}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      {/* View button */}
                      <a
                        href={
                          doc.fileUrl.includes("res.cloudinary.com")
                            ? doc.fileType.toLowerCase() === "pdf"
                              ? `/api/documents/proxy?url=${encodeURIComponent(doc.fileUrl)}`
                              : doc.fileUrl
                            : doc.fileUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-full bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center border border-blue-200 transition-colors shadow-sm"
                        title={doc.fileType.toLowerCase() === "pdf" ? "Xem PDF" : "Mở tài liệu"}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {/* Download button: forces real file download */}
                      <a
                        href={doc.fileUrl.includes("res.cloudinary.com")
                          ? doc.fileUrl.replace("/upload/", "/upload/fl_attachment/")
                          : doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="h-9 w-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center border border-green-200 transition-colors shadow-sm"
                        title="Tải về máy"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}
