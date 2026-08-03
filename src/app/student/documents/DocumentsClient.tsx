"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ExternalLink, BookOpen, GraduationCap, FileText } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
}

interface DocItem {
  id: string;
  type: "material" | "homework" | "class_doc";
  title: string;
  url: string;
  classId: string | null;
  className: string;
  subjectName: string;
  teacherName: string;
  dayLabel: string;
  time: string;
  isPublic: boolean;
}

interface DocumentsClientProps {
  classes: ClassItem[];
  docs: DocItem[];
}

export default function DocumentsClient({ classes, docs }: DocumentsClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const publicDocs = useMemo(() => docs.filter((d) => d.isPublic), [docs]);
  const classDocs = useMemo(() => docs.filter((d) => !d.isPublic), [docs]);

  // Nhóm docs theo lớp để hiển thị "Tất cả" / per-class
  const classDocsByClass = useMemo(() => {
    const map = new Map<string, DocItem[]>();
    for (const d of classDocs) {
      if (d.classId === null) continue;
      const list = map.get(d.classId) ?? [];
      list.push(d);
      map.set(d.classId, list);
    }
    return map;
  }, [classDocs]);

  const visibleDocs =
    selectedClassId === "all"
      ? classDocs
      : classDocs.filter((d) => d.classId === selectedClassId);

  const empty = publicDocs.length === 0 && visibleDocs.length === 0;

  return (
    <div>
      {/* Class selector */}
      <div className="bg-canvas border border-hairline rounded-lg p-4 shadow-sm mb-6 flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-ink">Lớp học</label>
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-canvas border border-hairline rounded-lg px-3 pr-9 py-2.5 text-xs text-ink outline-none focus:border-primary-focus w-full appearance-none"
          >
            <option value="all">Tất cả các lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted-48 pointer-events-none" />
        </div>
      </div>

      {empty ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-ink-muted-48 mx-auto mb-3" />
          <p className="text-sm text-ink-muted-48">Chưa có tài liệu nào cho lớp của bạn.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Tài liệu chung (public) */}
          {publicDocs.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Tài liệu chung
              </h2>
              <div className="space-y-2">
                {publicDocs.map((doc) => (
                  <DocRow key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          )}

          {/* Docs theo lớp */}
          {selectedClassId === "all" ? (
            classes.map((c) => {
              const list = classDocsByClass.get(c.id) ?? [];
              if (list.length === 0) return null;
              return (
                <div key={c.id}>
                  <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {c.name}
                  </h2>
                  <div className="space-y-2">
                    {list.map((doc) => (
                      <DocRow key={doc.id} doc={doc} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            (() => {
              const cls = classes.find((c) => c.id === selectedClassId);
              return (
                <div>
                  {cls && (
                    <h2 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {cls.name}
                    </h2>
                  )}
                  <div className="space-y-2">
                    {visibleDocs.map((doc) => (
                      <DocRow key={doc.id} doc={doc} />
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}

function DocRow({ doc }: { doc: DocItem }) {
  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-hairline hover:shadow-sm hover:border-blue-200 transition-all group"
    >
      <div className={`p-2 rounded-lg ${doc.type === "material" ? "bg-blue-50" : doc.type === "homework" ? "bg-amber-50" : "bg-violet-50"}`}>
        {doc.type === "material" ? (
          <BookOpen className="w-4 h-4 text-blue-500" />
        ) : doc.type === "homework" ? (
          <GraduationCap className="w-4 h-4 text-amber-500" />
        ) : (
          <FileText className="w-4 h-4 text-violet-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate group-hover:text-blue-600 transition-colors">
          {doc.title}
        </p>
        <p className="text-[11px] text-ink-muted-48 mt-0.5">
          {doc.type === "class_doc"
            ? `Danh mục: ${doc.subjectName}`
            : `${doc.subjectName} - ${doc.teacherName} - ${doc.dayLabel} ${doc.time}`}
        </p>
      </div>
      <ExternalLink className="w-4 h-4 text-ink-muted-48 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
