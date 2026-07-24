import React from "react";
import { db } from "@/lib/db";
import DocumentManager from "@/components/DocumentManager";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDocumentsPage() {
  const [docs, classes] = await Promise.all([
    db.document.findMany({
      include: { classVisibility: { include: { class: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.class.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-tagline text-lg font-bold text-ink">Quản lý Tài liệu</h1>
            <p className="text-xs text-ink-muted-80">Chia sẻ tài liệu học tập PDF/DOCX với học viên của bạn.</p>
          </div>
        </div>
      </div>

      <DocumentManager
        initialDocs={docs.map((d) => ({
          ...d,
          description: d.description ?? null,
          fileSize: d.fileSize ?? null,
          classVisibility: d.classVisibility.map((cv) => ({
            classId: cv.classId,
            class: cv.class,
          })),
        }))}
        classes={classes}
      />
    </div>
  );
}
