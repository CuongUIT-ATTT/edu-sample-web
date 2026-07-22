"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Download,
  Plus,
  Pencil,
  Trash2,
  X,
  Link2,
  Search,
  FileBadge,
  Eye,
  EyeOff,
  Upload,
  ExternalLink,
} from "lucide-react";
import {
  createDocument,
  updateDocument,
  deleteDocument,
  toggleDocumentPublish,
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
  published: boolean;
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

const FILE_TYPES = ["pdf", "docx", "doc", "xlsx", "pptx", "link"];

function guessFileType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "pdf";
  if (lower.includes(".docx") || lower.includes(".doc")) return "docx";
  if (lower.includes(".pptx") || lower.includes(".ppt")) return "pptx";
  if (lower.includes(".xlsx") || lower.includes(".xls")) return "xlsx";
  return "link";
}

function guessFileName(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/");
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : url;
  } catch {
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  }
}

/**
 * Returns the best URL to open a document:
 * - PDF from Cloudinary → Internal proxy route (inline rendering with proper headers)
 * - Other Cloudinary files → direct URL (browser will handle)
 * - External links → unchanged
 */
function getDocumentViewUrl(fileUrl: string): string {
  // R2 files are served publicly — no proxy needed
  return fileUrl;
}

export default function DocumentManager({ initialDocs }: DocumentManagerProps) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingPublish, setTogglingPublish] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    title: "",
    description: "",
    category: "Chung",
    fileUrl: "",
    fileName: "",
    fileType: "pdf",
    fileSize: "",
    published: false,
  };

  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
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
      published: doc.published,
    });
    setShowModal(true);
  };

  const handleUrlChange = (url: string) => {
    setForm((prev) => ({
      ...prev,
      fileUrl: url,
      fileName: prev.fileName || guessFileName(url),
      fileType: prev.fileType !== "pdf" ? prev.fileType : guessFileType(url),
    }));
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      
      const res = await fetch("/api/upload-document", {
        method: "POST",
        body: fd,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải lên Cloudinary thất bại");
      
      setForm((prev) => ({
        ...prev,
        fileUrl: data.url,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        title: prev.title || file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "),
      }));
      
      showToast("Tải lên Cloudinary thành công!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi tải tệp lên", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePublish = async (doc: Doc) => {
    setTogglingPublish(doc.id);
    const newStatus = !doc.published;
    try {
      const res = await toggleDocumentPublish(doc.id, newStatus);
      if (!res.success) throw new Error(res.error);
      setDocs((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, published: newStatus } : d))
      );
      showToast(
        newStatus
          ? "Đã hiển thị tài liệu công khai!"
          : "Đã ẩn tài liệu khỏi danh sách công khai!",
        "success"
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Không thể thay đổi trạng thái",
        "error"
      );
    } finally {
      setTogglingPublish(null);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("Vui lòng nhập tiêu đề tài liệu", "warning");
      return;
    }
    if (!form.fileUrl.trim()) {
      showToast("Vui lòng nhập đường dẫn (URL) tài liệu", "warning");
      return;
    }

    setSaving(true);
    try {
      const input: DocumentInput = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        fileUrl: form.fileUrl.trim(),
        fileName: form.fileName.trim() || guessFileName(form.fileUrl.trim()),
        fileType: form.fileType || guessFileType(form.fileUrl.trim()),
        fileSize: form.fileSize.trim() || undefined,
        category: form.category,
        published: form.published,
      };

      if (editing) {
        const res = await updateDocument(editing.id, input);
        if (!res.success) throw new Error(res.error);
        setDocs((prev) =>
          prev.map((d) => (d.id === editing.id ? { ...d, ...input } : d))
        );
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

  const typeColor = (type: string) => {
    if (type === "pdf") return "bg-red-50 text-red-700";
    if (type === "docx" || type === "doc") return "bg-blue-50 text-blue-700";
    if (type === "pptx") return "bg-orange-50 text-orange-700";
    if (type === "xlsx") return "bg-green-50 text-green-700";
    return "bg-slate-50 text-slate-700";
  };

  const iconColor = (type: string) => {
    if (type === "pdf") return "bg-red-50 text-red-600";
    if (type === "docx" || type === "doc") return "bg-blue-50 text-blue-600";
    if (type === "pptx") return "bg-orange-50 text-orange-600";
    if (type === "xlsx") return "bg-green-50 text-green-600";
    return "bg-slate-50 text-slate-600";
  };

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
            {search
              ? "Không tìm thấy tài liệu phù hợp."
              : "Chưa có tài liệu nào. Bấm \"Thêm tài liệu mới\" để bắt đầu."}
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
                <div className="flex items-center gap-2">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor(doc.fileType)}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  {doc.published ? (
                    <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Công khai
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Nội bộ
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTogglePublish(doc)}
                    disabled={togglingPublish === doc.id}
                    className={`h-7 w-7 rounded-md border border-hairline flex items-center justify-center transition-colors ${
                      doc.published
                        ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                        : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                    }`}
                    title={doc.published ? "Chuyển thành Nội bộ" : "Chuyển thành Công khai"}
                  >
                    {doc.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
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
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeColor(doc.fileType)}`}>
                    {doc.fileType}
                  </span>
                  {doc.fileSize && (
                    <span className="text-[10px] text-ink-muted-48">{doc.fileSize}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {/* View button: Google Docs Viewer for PDF, direct link for others */}
                  <a
                    href={getDocumentViewUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center border border-blue-200 transition-colors"
                    title={doc.fileType.toLowerCase() === "pdf" ? "Xem PDF" : "Mở tài liệu"}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {/* Download button: signed URL redirect for fast CDN download */}
                  <a
                    href={doc.fileUrl.includes("res.cloudinary.com")
                      ? `/api/documents/download?url=${encodeURIComponent(doc.fileUrl)}&name=${encodeURIComponent(doc.fileName || "download")}`
                      : doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="h-8 w-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center border border-green-200 transition-colors"
                    title="Tải về máy"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl shadow-product w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-divider-soft">
              <h2 className="font-tagline text-sm font-bold text-ink">
                {editing ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="h-7 w-7 rounded-md text-ink-muted-80 hover:bg-surface-pearl flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col gap-5 p-6 overflow-y-auto">
              
              {/* URL and File Upload Row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  Đường dẫn tài liệu (URL) hoặc Tải tệp lên *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.fileUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://drive.google.com/... hoặc bấm Tải lên"
                    className="bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink outline-none focus:border-primary-focus font-mono flex-1 h-9"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-slate-100 hover:bg-slate-200 border border-hairline text-ink text-xs px-3 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 h-9 shrink-0 font-medium"
                  >
                    {uploading ? (
                      <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Tải tệp lên
                  </button>
                </div>
                <p className="text-[10px] text-ink-muted-48">
                  Hỗ trợ dán liên kết Drive/Dropbox hoặc tải trực tiếp tài liệu của bạn (PDF, Word, Excel, PowerPoint) lên đám mây Cloudinary của trường.
                </p>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Tiêu đề tài liệu *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ví dụ: Sổ tay công thức giải nhanh Toán THPT"
                  className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus w-full"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">Mô tả <span className="text-ink-muted-48 font-normal">(tùy chọn)</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Mô tả ngắn về nội dung tài liệu..."
                  className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus resize-none w-full"
                />
              </div>

              {/* Category + Type in 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink">Môn học / Danh mục</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus w-full"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink">Loại tệp</label>
                  <select
                    value={form.fileType}
                    onChange={(e) => setForm((p) => ({ ...p, fileType: e.target.value }))}
                    className="bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-xs text-ink outline-none focus:border-primary-focus w-full"
                  >
                    {FILE_TYPES.map((t) => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Published switch */}
              <div className="flex items-center justify-between border border-divider-soft rounded-lg p-3.5 bg-surface-pearl">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-ink">Hiển thị công khai</span>
                  <span className="text-[10px] text-ink-muted-80">
                    Cho phép khách vãng lai xem và tải tài liệu này ở trang chủ công cộng.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
                  className="h-4 w-4 text-primary focus:ring-primary border-hairline rounded"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-divider-soft bg-surface-pearl">
              <button
                onClick={() => setShowModal(false)}
                className="border border-divider-soft hover:bg-canvas text-ink-muted-80 text-xs px-4 py-2.5 rounded-pill font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="bg-primary hover:bg-primary-focus text-white text-xs px-6 py-2.5 rounded-pill font-semibold flex items-center gap-2 disabled:opacity-60 transition-colors"
              >
                {saving && (
                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {editing ? "Lưu thay đổi" : "Thêm tài liệu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
