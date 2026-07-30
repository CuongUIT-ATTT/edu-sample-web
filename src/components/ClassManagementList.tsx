/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { BookOpen, Users, Plus, Trash2, Edit3, GraduationCap, X, ChevronDown, ChevronUp, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { updateClass, deleteClass, removeStudentFromClass, addStudentToClass } from "@/actions/classes";

interface FormTeacher {
  id: string;
  user: {
    name: string;
  };
}

interface Student {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
  formTeacher?: FormTeacher | null;
  students: Student[];
  _count: {
    students: number;
  };
}

interface ClassManagementListProps {
  initialClasses: ClassItem[];
  teachers: { id: string; user: { name: string } }[];
  allStudents: { id: string; classes: { id: string; name: string }[]; user: { name: string; email: string } }[];
  createClassAction: (formData: FormData) => Promise<any>;
}

export default function ClassManagementList({ 
  initialClasses, 
  teachers, 
  allStudents,
  createClassAction 
}: ClassManagementListProps) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  
  // Modals / Status
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for class editing
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("10");
  const [formTeacherId, setFormTeacherId] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedClassId(expandedClassId === id ? null : id);
  };

  const handleClassDelete = async (id: string, className: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá lớp ${className} không?`)) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await deleteClass(id);
    if (res.success) {
      setSuccessMsg(res.message || "Xoá lớp thành công.");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Xoá lớp thất bại.");
    }
  };

  const openEditModal = (c: ClassItem) => {
    setEditingClass(c);
    setName(c.name);
    setGradeLevel(c.gradeLevel.toString());
    setFormTeacherId(c.formTeacher?.id || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClass) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("gradeLevel", gradeLevel);
    formData.append("formTeacherId", formTeacherId);

    const res = await updateClass(editingClass.id, formData);
    if (res.success) {
      setSuccessMsg(res.message || "Cập nhật thành công.");
      setIsEditOpen(false);
      setEditingClass(null);
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Cập nhật thất bại.");
    }
  };

  const handleRemoveStudent = async (classId: string, studentId: string, studentName: string) => {
    if (!confirm(`Bạn có chắc muốn loại học viên ${studentName} khỏi lớp này không?`)) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await removeStudentFromClass(classId, studentId);
    if (res.success) {
      setSuccessMsg(res.message || "Đã loại học viên khỏi lớp.");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Thao tác thất bại.");
    }
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClass || selectedStudentIds.length === 0) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await addStudentToClass(selectedClass.id, selectedStudentIds);
    if (res.success) {
      setSuccessMsg(res.message || "Đã thêm học viên vào lớp.");
      setIsAddStudentOpen(false);
      setSelectedStudentIds([]);
      setStudentSearchTerm("");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Thao tác thất bại.");
    }
  };

  // Get students who are not in the currently selected class
  const availableStudents = allStudents.filter(
    (s) => !s.classes?.some((c: any) => c.id === selectedClass?.id)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Alert Notices */}
      <div className="lg:col-span-3">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between gap-3 text-sm">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)}><X className="h-4 w-4" /></button>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center justify-between gap-3 text-sm">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)}><X className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      {/* Left List */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý lớp luyện thi</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Danh mục lớp luyện thi, danh sách học viên, và giảng viên phụ trách</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
            <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Tổng cộng ({classes.length} lớp luyện thi)
            </h2>
          </div>

          <div className="divide-y divide-hairline">
            {classes.map((c) => {
              const isExpanded = expandedClassId === c.id;
              return (
                <div key={c.id} className="flex flex-col hover:bg-surface-pearl/50 transition-colors">
                  <div className="flex items-center justify-between px-6 py-4 cursor-pointer" onClick={() => toggleExpand(c.id)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-50 text-primary rounded-full flex items-center justify-center font-bold">
                        {c.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-body-strong text-ink">{c.name}</p>
                        <p className="text-xs font-caption text-ink-muted-80">
                          Khối {c.gradeLevel} • GV: {c.formTeacher?.user.name || "Chưa có"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClass(c);
                        }}
                        className="text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {c.students.length} Học viên
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(c);
                        }}
                        className="text-primary hover:bg-blue-50 p-2 rounded-full"
                        title="Sửa lớp"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassDelete(c.id, c.name);
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                        title="Xoá lớp"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {isExpanded ? <ChevronUp className="h-4 w-4 text-ink-muted-48" /> : <ChevronDown className="h-4 w-4 text-ink-muted-48" />}
                    </div>
                  </div>

                  {/* Expanded view for student list */}
                  {isExpanded && (
                    <div className="px-14 pb-4 pt-1 bg-surface-pearl/30 border-t border-divider-soft animate-fade-in">
                      <p className="text-[10px] font-caption-strong text-ink-muted-48 uppercase tracking-widest mb-2">Học viên đang theo học</p>
                      {c.students.length === 0 ? (
                        <p className="text-xs font-body italic text-ink-muted-48">Chưa có học viên nào trong lớp này.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {c.students.map((student) => (
                            <div key={student.id} className="flex items-center justify-between text-xs font-body text-ink bg-canvas border border-hairline p-2 rounded">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-blue-500" />
                                <div>
                                  <span className="font-semibold">{student.user.name}</span>
                                  <span className="text-[10px] text-ink-muted-48 block">{student.user.email}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveStudent(c.id, student.id, student.user.name)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                title="Loại khỏi lớp"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-tagline text-lg font-semibold text-ink">Tạo lớp mới</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Thêm lớp luyện thi mới vào hệ thống</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
          <form action={async (fd) => {
            await createClassAction(fd);
            window.location.reload();
          }} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Tên lớp luyện thi</label>
              <input
                type="text"
                name="name"
                placeholder="VIP1, VIP2, Chuyên đề..."
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Khối học</label>
              <select
                name="gradeLevel"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              >
                <option value="10">Khối Lớp 10 (Grade 10)</option>
                <option value="11">Khối Lớp 11 (Grade 11)</option>
                <option value="12">Khối Lớp 12 (Grade 12)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Giảng viên phụ trách</label>
              <select
                name="formTeacherId"
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
              >
                <option value="">— Chọn giảng viên —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Tạo lớp luyện thi
            </button>
          </form>
        </div>
      </div>

      {/* CLASS EDIT MODAL WITH FIXED SIZE */}
      {isEditOpen && editingClass && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-full sm:max-w-lg shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink">
                Sửa lớp luyện thi: {editingClass.name}
              </h3>
              <button 
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingClass(null);
                }} 
                className="text-ink-muted-48 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Tên lớp</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VIP1, VIP2..."
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Khối học</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                >
                  <option value="10">Khối Lớp 10</option>
                  <option value="11">Khối Lớp 11</option>
                  <option value="12">Khối Lớp 12</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Giảng viên chủ nhiệm</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                >
                  <option value="">— Chọn giảng viên —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.user.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors w-full mt-4 text-sm"
              >
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED STUDENTS MODAL WITH FIXED SIZE & STUDENT ASSIGNMENT */}
      {selectedClass && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-full sm:max-w-lg shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Học viên lớp {selectedClass.name}
              </h3>
              <button 
                onClick={() => {
                  setSelectedClass(null);
                  setIsAddStudentOpen(false);
                }} 
                className="text-ink-muted-48 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
              {/* Add Student Trigger / Form */}
              {!isAddStudentOpen ? (
                <button
                  onClick={() => setIsAddStudentOpen(true)}
                  className="bg-primary hover:bg-primary-focus text-white text-xs px-4 py-2 rounded-pill font-semibold flex items-center justify-center gap-1.5 self-start shadow-sm mb-2"
                >
                  <UserPlus className="h-4 w-4" /> Thêm học viên vào lớp này
                </button>
              ) : (
                <form onSubmit={handleAddStudent} className="bg-surface-pearl border border-divider-soft p-4 rounded flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-caption-strong text-ink-muted-80">Chọn các học viên chưa tham gia lớp</label>
                    
                    {/* Search Input */}
                    <input
                      type="text"
                      placeholder="Tìm học viên theo tên/email..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="bg-canvas border border-hairline rounded px-3 py-1.5 text-xs outline-none w-full"
                    />

                    {/* Select All Checkbox */}
                    {availableStudents.filter(
                      (s) =>
                        s.user.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.user.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                    ).length > 0 && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink border-b border-divider pb-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={
                            selectedStudentIds.length ===
                            availableStudents.filter(
                              (s) =>
                                s.user.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                s.user.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                            ).length
                          }
                          onChange={(e) => {
                            const filtered = availableStudents.filter(
                              (s) =>
                                s.user.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                                s.user.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                            );
                            if (e.target.checked) {
                              setSelectedStudentIds(filtered.map((s) => s.id));
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          className="accent-primary h-3.5 w-3.5"
                        />
                        <span>Chọn tất cả ({
                          availableStudents.filter(
                            (s) =>
                              s.user.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                              s.user.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                          ).length
                        })</span>
                      </label>
                    )}

                    {/* List of Checkboxes with Scrollbar */}
                    <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1.5 pr-1 border border-divider-soft p-2 rounded bg-canvas">
                      {availableStudents.filter(
                        (s) =>
                          s.user.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          s.user.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).length === 0 ? (
                        <p className="text-xs text-ink-muted-48 italic py-2 text-center">Không tìm thấy học viên khả dụng</p>
                      ) : (
                        availableStudents
                          .filter(
                            (s) =>
                              s.user.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                              s.user.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
                          )
                          .map((s) => {
                            const isChecked = selectedStudentIds.includes(s.id);
                            return (
                              <label key={s.id} className="flex items-start gap-2.5 text-xs text-ink hover:bg-surface-pearl p-1 rounded cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentIds((prev) => [...prev, s.id]);
                                    } else {
                                      setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                                    }
                                  }}
                                  className="accent-primary h-3.5 w-3.5 mt-0.5"
                                />
                                <div className="flex flex-col">
                                  <span className="font-semibold">{s.user.name}</span>
                                  <span className="text-[10px] text-ink-muted-48">{s.user.email} {s.classes && s.classes.length > 0 ? `[Hiện ở: ${s.classes.map((c: any) => c.name).join(", ")}]` : "[Chưa xếp lớp]"}</span>
                                </div>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddStudentOpen(false);
                        setSelectedStudentIds([]);
                        setStudentSearchTerm("");
                      }}
                      className="border border-divider-soft hover:bg-canvas text-xs px-3 py-1.5 rounded-pill"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={selectedStudentIds.length === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-pill font-semibold"
                    >
                      Xác nhận thêm ({selectedStudentIds.length})
                    </button>
                  </div>
                </form>
              )}

              {/* Student Listing */}
              <div className="divide-y divide-hairline">
                {selectedClass.students.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="h-10 w-10 text-ink-muted-48 mx-auto mb-2" />
                    <p className="text-xs font-body text-ink-muted-80">Lớp học này chưa có học viên nào.</p>
                  </div>
                ) : (
                  selectedClass.students.map((s, idx) => (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-body-strong text-ink font-semibold">{s.user.name}</p>
                          <p className="text-[10px] font-caption text-ink-muted-48">{s.user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(selectedClass.id, s.id, s.user.name)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"
                        title="Loại khỏi lớp"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
