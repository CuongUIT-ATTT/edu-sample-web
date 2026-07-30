"use client";

import React, { useState } from "react";
import { BookOpen, Plus, Trash2, Edit3, X, CheckCircle, AlertCircle } from "lucide-react";
import { createSubject, deleteSubject, updateSubject } from "@/actions/subjects";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  _count: {
    schedules: number;
  };
}

interface SubjectManagementProps {
  subjects: SubjectItem[];
}

export default function SubjectManagement({ subjects }: SubjectManagementProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await createSubject(formData);

    if (res.success) {
      setSuccessMsg(res.message || "Thành công");
      e.currentTarget.reset();
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Có lỗi xảy ra");
    }
  };

  const openEditModal = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditCode(sub.code);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSubject) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("code", editCode);

    const res = await updateSubject(editingSubject.id, formData);
    if (res.success) {
      setSuccessMsg(res.message || "Thành công");
      setIsEditOpen(false);
      setEditingSubject(null);
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá môn học ${name}?`)) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await deleteSubject(id);
    if (res.success) {
      setSuccessMsg(res.message || "Thành công");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Messages */}
      <div className="lg:col-span-3">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-3 text-sm mb-4">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3 text-sm mb-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Left List */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý môn học</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Danh mục các môn luyện thi và ôn tập tại trung tâm</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-x-auto">
          <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
            <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Tổng cộng ({subjects.length} môn học)
            </h2>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline bg-surface-pearl text-left">
                <th className="px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Tên môn học</th>
                <th className="px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Mã môn học</th>
                <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Số ca học liên kết</th>
                <th className="text-center px-6 py-3 text-[11px] font-caption-strong text-ink-muted-48 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-surface-pearl/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-body-strong text-ink">{sub.name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-ink-muted-80 uppercase">{sub.code}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-caption bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                      {sub._count.schedules} ca học
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors"
                        title="Sửa môn học"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                        title="Xoá môn học"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-tagline text-lg font-semibold text-ink">Thêm môn học mới</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Khai báo môn thi/môn học mới</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Tên môn học</label>
              <input
                type="text"
                name="name"
                placeholder="Toán học, Vật lý, Hóa học..."
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Mã môn học</label>
              <input
                type="text"
                name="code"
                placeholder="TOAN10, LY11, HOA12..."
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full uppercase"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Thêm môn học
            </button>
          </form>
        </div>
      </div>

      {/* Edit Subject Modal */}
      {isEditOpen && editingSubject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-full sm:max-w-lg shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-divider flex items-center justify-between bg-surface-pearl">
              <h3 className="font-tagline text-base font-semibold text-ink flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Chỉnh sửa môn học
              </h3>
              <button 
                onClick={() => {
                  setEditingSubject(null);
                  setIsEditOpen(false);
                }} 
                className="text-ink-muted-48 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Tên môn học</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Toán học, Vật lý, Hóa học..."
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Mã môn học</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder="TOAN10, LY11, HOA12..."
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full uppercase"
                  required
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubject(null);
                    setIsEditOpen(false);
                  }}
                  className="border border-divider-soft hover:bg-surface-pearl text-xs px-4 py-2 rounded-pill font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-focus text-white text-xs px-5 py-2 rounded-pill font-semibold shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
