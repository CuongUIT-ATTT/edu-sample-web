"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Download,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Search,
  FileBadge,
} from "lucide-react";
import {
  createDocument,
  updateDocument,
  deleteDocument,
  DocumentInput,
} from "@/actions/documents";
import { showToast } from "@/components/Toast";

interface Doc {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: string | null;
  category: string;
  createdAt: Date;
}

interface DocumentManagerProps {
  initialDocs: Doc[];
}

const CATEGORIES = [
  "Toán học", "Vật lý", "Hóa học", "Sinh học",
  "Ngữ văn", "Lịch sử", "Địa lý", "Tiếng Anh",
  "GDCD", "Tin học", "Chung",
];

export default function DocumentManager({ initialDocs }: DocumentManagerProps) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    title: string;
    description: string;
    category: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: string;
  }>({
    title: "",
    description: "",
    category: "Chung",
    fileUrl: "",
    fileName: "",
    fileType: "",
    fileSize: "",
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", category: "Chung", fileUrl: "", fileName: "", fileType: "", fileSize: "" });
    setShowModal(true);
  };

  const openEdit = (doc: Doc) => {
    setEditing(doc);
    setForm({
      title: doc.title,
      description: doc.description || "",
      category: doc.category,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize || "",
    });
    setShowModal(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-document", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload thất bại");
      setForm((prev) => ({
        ...prev,
        fileUrl: data.url,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        title: prev.title || file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "),
      }));
      showToast("Tải tệp lên thành công!", "success");
    } catch (err: unknown) {
      showToast((err instanceof Error ? err.message : "Lỗi tải file"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast("Vui lòng nhập tiêu đề tài liệu", "warning"); return; }
    if (!form.fileUrl) { showToast("Vui lòng tải lên hoặc nhập đường dẫn tài liệu", "warning"); return; }

    setSaving(true);
    try {
      const input: DocumentInput = {
        title: form.title,
        description: form.description || undefined,
        fileUrl: form.fileUrl,
        fileName: form.fileName || form.title,
        fileType: form.fileType || "pdf",
        fileSize: form.fileSize || undefined,
        category: form.category,
      };

      if (editing) {
        const res = await updateDocument(editing.id, input);
        if (!res.success) throw new Error(res.error);
        setDocs((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...input } : d)));
        showToast("Cập nhật tài liệu thành công!", "success");
      } else {
        const res = await createDocument(input);
        if (!res.success || !res.data) throw new Error(res.error);
        setDocs((prev) => [res.data as Doc, ...prev]);
        showToast("Thêm tài liệu thành công!", "success");
      }
      setShowModal(false);
    } catch (err: unknown) {
      showToast((err instanceof Error ? err.message : "Lỗi lưu tài liệu"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Xóa tài liệu "${doc.title}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(doc.id);
    try {
      const res = await deleteDocument(doc.id);
      if (!res.success) throw new Error(res.error);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      showToast("Xóa tài liệu thành công!", "success");
    } catch (err: unknown) {
      showToast((err instanceof Error ? err.message : "Lỗi xóa tài liệu"), "error");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill pl-9 pr-4 py-2 h-9 text-xs text-ink outline-none focus:border-primary-focus w-full"
          />
        </div>
        <button
          onClick={openAdd}
          className="bg-primary hover:bg-primary-focus text-white text-xs px-4 py-2.5 rounded-pill font-semibold flex items-center gap-2 apple-active-scale transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Thêm tài liệu mới
        </button>
      </div>

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
          <FileBadge className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
          <p className="text-sm text-ink-muted-80 font-body">
            {search ? "Không tìm thấy tài liệu phù hợp." : "Chưa có tài liệu nào. Bấm \"Thêm tài liệu mới\" để bắt đầu."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileType === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(doc)}
                    className="h-7 w-7 rounded-md border border-hairline bg-surface-pearl hover:bg-canvas flex items-center justify-center text-ink-muted-80 hover:text-primary transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    className="h-7 w-7 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[10px] uppercase font-bold text-ink-muted-48 tracking-wider">{doc.category}</span>
                <h3 className="font-body-strong text-sm font-semibold text-ink leading-snug line-clamp-2">
                  {doc.title}
                </h3>
                {doc.description && (
                  <p className="text-[11px] text-ink-muted-80 line-clamp-2 leading-relaxed">{doc.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-divider-soft pt-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${doc.fileType === "pdf" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                    {doc.fileType.toUpperCase()}
                  </span>
                  {doc.fileSize && <span className="text-[10px] text-ink-muted-48">{doc.fileSize}</span>}
                </div>
                <a
                  href={doc.fileUrl}
                  download={doc.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center border border-blue-200 transition-colors"
                  title="Tải xuống"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl shadow-product w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-divider-soft">
              <h2 className="font-tagline text-sm font-bold text-ink">
                {editing ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
              </h2>
              <button onClick={() => setShowModal(false)} className="h-7 w-7 rounded-md text-ink-muted-80 hover:bg-surface-pearl flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6 overflow-y-auto">
              {/* File upload zone */}
              <div
                className="border-2 border-dashed border-hairline rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-blue-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-ink-muted-80">Đang tải lên...</p>
                  </div>
                ) : form.fileUrl ? (
                  <div className="flex flex-col items-center gap-1">
                    <FileText className="h-8 w-8 text-primary mb-1" />
                    <p className="text-xs font-semibold text-ink">{form.fileName}</p>
                    <p className="text-[10px] text-ink-muted-48">{form.fileSize} • {form.fileType?.toUpperCase()} • Bấm để thay đổi</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-ink-muted-48 mb-1" />
                    <p className="text-xs font-semibold text-ink">Bấm để tải tệp PDF hoặc DOCX</p>
                    <p className="text-[10px] text-ink-muted-48">Tối đa 20MB</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Tiêu đề tài liệu *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ví dụ: Sổ tay công thức giải nhanh Toán THPT"
                  className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Mô tả (tùy chọn)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Mô tả ngắn về nội dung tài liệu..."
                  className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Môn học / Danh mục</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Hoặc nhập đường dẫn tài liệu (URL)</label>
                <input
                  type="text"
                  value={form.fileUrl}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      fileUrl: e.target.value,
                      fileName: p.fileName || e.target.value.split("/").pop() || "",
                      fileType: p.fileType || (e.target.value.endsWith(".pdf") ? "pdf" : "docx"),
                    }))
                  }
                  placeholder="https://... hoặc /uploads/documents/..."
                  className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end px-6 py-4 border-t border-divider-soft bg-surface-pearl">
              <button
                onClick={() => setShowModal(false)}
                className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2.5 rounded-pill font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="bg-primary hover:bg-primary-focus text-white text-xs px-6 py-2.5 rounded-pill font-semibold flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                {editing ? "Lưu thay đổi" : "Thêm tài liệu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
