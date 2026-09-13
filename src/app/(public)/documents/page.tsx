import React from "react";
import { db } from "@/lib/db";
import { BookOpen, Download, ExternalLink, FileText, FolderOpen, Search, Sparkles } from "lucide-react";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kho Tài Liệu Ôn Thi | EduWeb",
  description: "Tải miễn phí tài liệu ôn thi, sơ đồ tư duy, sổ tay công thức được biên soạn bởi EduWeb.",
};

interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileType: string;
  fileSize: string | null;
  fileUrl: string;
  fileName: string | null;
}

function groupDocumentsByCategory(documents: DocumentRecord[]): Record<string, DocumentRecord[]> {
  return documents.reduce<Record<string, DocumentRecord[]>>((groupedDocuments, document) => {
    const categoryDocuments = groupedDocuments[document.category] || [];

    return {
      ...groupedDocuments,
      [document.category]: [...categoryDocuments, document],
    };
  }, {});
}

function getFileTone(fileType: string): string {
  return fileType.toLowerCase() === "pdf"
    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
    : "bg-primary/10 text-primary border-primary/20";
}

export default async function DocumentsPage() {
  const documents = await db.document.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  const byCategory = groupDocumentsByCategory(documents);
  const categoryEntries = Object.entries(byCategory);
  const totalCategories = categoryEntries.length;

  return (
    <div className="relative bg-canvas min-h-screen py-12 px-4 sm:px-6 overflow-hidden transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,102,204,0.14),transparent_48%),radial-gradient(circle_at_88%_8%,rgba(168,85,247,0.11),transparent_45%),radial-gradient(circle_at_55%_100%,rgba(34,197,94,0.1),transparent_46%)]" />

      <div className="max-w-[1100px] mx-auto flex flex-col gap-10 relative z-10">
        <section className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 animate-fade-in overflow-hidden relative">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <StitchIconBadge icon={BookOpen} variant="blue" size="md" />
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full uppercase tracking-wider">
                Kho tài liệu EduWeb
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted-80">
              <span className="rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/15 px-3.5 py-1.5 shadow-sm">
                {documents.length} tài liệu
              </span>
              <span className="rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-white/15 px-3.5 py-1.5 shadow-sm">
                {totalCategories} chuyên mục
              </span>
            </div>
          </div>

          <div className="relative z-10 max-w-[760px] flex flex-col gap-4">
            <h1 className="font-display-lg text-3xl sm:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Tài liệu ôn thi & tóm tắt lý thuyết
            </h1>
            <p className="font-body text-ink-muted-80 text-sm sm:text-base leading-relaxed">
              Tải miễn phí hệ thống sổ tay công thức, đề cương trọng tâm và tài liệu tự học được biên soạn bởi đội ngũ EduWeb cho hành trình bứt phá điểm số.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Biên soạn nội bộ", value: "Chuẩn cấu trúc", icon: Sparkles },
              { label: "Tải nhanh", value: "Mở tab mới", icon: Download },
              { label: "Theo chuyên mục", value: "Dễ tra cứu", icon: FolderOpen },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl bg-canvas/60 dark:bg-slate-800/60 border border-hairline/60 px-4 py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-ink-muted-48">{item.label}</p>
                    <p className="text-xs font-extrabold text-ink mt-0.5">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {documents.length === 0 ? (
          <section className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-10 sm:p-16 text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
              <Search className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-tagline text-2xl font-extrabold text-ink">Kho tài liệu đang được cập nhật</h2>
              <p className="text-sm text-ink-muted-80 max-w-[480px] mt-2 leading-relaxed">
                Chưa có tài liệu nào được công khai. Vui lòng quay lại sau để tải các bộ đề cương và sổ tay ôn thi mới nhất.
              </p>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-8">
            {categoryEntries.map(([category, docs]) => (
              <section key={category} className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap px-1">
                  <div className="flex items-center gap-3">
                    <StitchIconBadge icon={FolderOpen} variant="purple" size="sm" />
                    <h2 className="font-tagline text-xl sm:text-2xl font-extrabold text-ink tracking-tight">{category}</h2>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                    {docs.length} tài liệu
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {docs.map((doc) => (
                    <article
                      key={doc.id}
                      className="group backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-xl motion-card flex flex-col justify-between gap-6 overflow-hidden relative"
                    >
                      <div className="absolute -right-10 -bottom-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />

                      <div className="relative z-10 flex gap-4 items-start">
                        <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-inner ${getFileTone(doc.fileType)}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-2 min-w-0">
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-ink-muted-48">{doc.category}</span>
                          <h3 className="font-body-strong text-base font-extrabold text-ink leading-snug group-hover:text-primary transition-colors">
                            {doc.title}
                          </h3>
                          {doc.description && <p className="text-xs text-ink-muted-80 leading-relaxed line-clamp-2">{doc.description}</p>}
                          <p className="text-[10px] text-ink-muted-48 font-mono font-bold uppercase tracking-wide">
                            {doc.fileType}{doc.fileSize ? ` • ${doc.fileSize}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-between gap-3 pt-4 border-t border-hairline/60">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:text-primary-focus text-xs font-extrabold apple-active-scale transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Mở tài liệu</span>
                        </a>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.fileName || undefined}
                          className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-full text-xs font-extrabold apple-active-scale transition-all"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Tải về</span>
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
