/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { BookOpen, Users, Plus, Star, Award, GraduationCap, X, ChevronDown, ChevronUp } from "lucide-react";

interface FormTeacher {
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
  createClassAction: (formData: FormData) => Promise<any>;
}

export default function ClassManagementList({ 
  initialClasses, 
  teachers, 
  createClassAction 
}: ClassManagementListProps) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedClassId(expandedClassId === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <div className="flex items-center gap-3">
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
                            <div key={student.id} className="flex items-center gap-2 text-xs font-body text-ink bg-canvas border border-hairline p-2 rounded">
                              <GraduationCap className="h-4 w-4 text-blue-500" />
                              <div>
                                <span className="font-semibold">{student.user.name}</span>
                                <span className="text-[10px] text-ink-muted-48 block">{student.user.email}</span>
                              </div>
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
            // In a real app we'd reload or let Server Components trigger the reload
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

      {/* Modal - View all students detailed list */}
      {selectedClass && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-full max-w-lg shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Danh sách học viên lớp {selectedClass.name}
              </h3>
              <button 
                onClick={() => setSelectedClass(null)} 
                className="text-ink-muted-48 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
              {selectedClass.students.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-10 w-10 text-ink-muted-48 mx-auto mb-2" />
                  <p className="text-sm font-body text-ink-muted-80">Lớp học này chưa có học viên nào tham gia.</p>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {selectedClass.students.map((s, idx) => (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-body-strong text-ink font-semibold">{s.user.name}</p>
                          <p className="text-xs font-caption text-ink-muted-48">{s.user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
