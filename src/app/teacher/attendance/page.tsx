"use client";

import React, { useState, useEffect, useTransition } from "react";
import { CheckSquare, RefreshCw, Check, X, Clock, BookOpen } from "lucide-react";
import { markAttendance } from "@/actions/attendance";
import { AttendanceStatus } from "@prisma/client";

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function TeacherAttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load classes
  useEffect(() => {
    fetch("/api/teacher/classes")
      .then((r) => r.json())
      .then((data) => {
        setClasses(data.classes || []);
        if (data.classes?.length > 0) setSelectedClassId(data.classes[0].id);
      })
      .catch(() => {});
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    fetch(`/api/teacher/classes/${selectedClassId}/students`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students || []);
        // Default all to PRESENT
        const defaultAttendance: Record<string, AttendanceStatus> = {};
        (data.students || []).forEach((s: Student) => {
          defaultAttendance[s.id] = "PRESENT";
        });
        setAttendance(defaultAttendance);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [selectedClassId]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = () => {
    setSubmitResult(null);
    startTransition(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const student of students) {
        const status = attendance[student.id] || "PRESENT";
        const result = await markAttendance({
          studentId: student.id,
          date: new Date(selectedDate),
          status,
        });
        if (result.success) successCount++;
        else errorCount++;
      }

      setSubmitResult({
        success: errorCount === 0,
        message:
          errorCount === 0
            ? `✅ Đã lưu điểm danh cho ${successCount} học viên.`
            : `⚠️ Lưu thành công ${successCount}, thất bại ${errorCount} học viên.`,
      });
    });
  };

  const statusButtons: { status: AttendanceStatus; label: string; icon: React.ReactNode; classes: string }[] = [
    { status: "PRESENT", label: "Có mặt", icon: <Check className="h-3 w-3" />, classes: "bg-green-50 text-green-700 border-green-300 hover:bg-green-100" },
    { status: "ABSENT", label: "Vắng", icon: <X className="h-3 w-3" />, classes: "bg-red-50 text-red-700 border-red-300 hover:bg-red-100" },
    { status: "LATE", label: "Trễ", icon: <Clock className="h-3 w-3" />, classes: "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100" },
    { status: "EXCUSED", label: "Phép", icon: <BookOpen className="h-3 w-3" />, classes: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100" },
  ];

  const counts = {
    PRESENT: Object.values(attendance).filter((s) => s === "PRESENT").length,
    ABSENT: Object.values(attendance).filter((s) => s === "ABSENT").length,
    LATE: Object.values(attendance).filter((s) => s === "LATE").length,
    EXCUSED: Object.values(attendance).filter((s) => s === "EXCUSED").length,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Điểm danh chuyên cần học viên</h1>
        <p className="font-caption text-ink-muted-80 mt-1">Ghi nhận điểm danh theo lớp luyện thi và ca học</p>
      </div>

      {/* Controls */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">Lớp luyện thi</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus"
          >
            {classes.length === 0 && <option value="">— Chọn lớp —</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">Ngày ca học</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus"
          />
        </div>
      </div>

      {/* Quick Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Có mặt", count: counts.PRESENT, color: "text-green-600" },
            { label: "Vắng mặt", count: counts.ABSENT, color: "text-red-600" },
            { label: "Đi trễ", count: counts.LATE, color: "text-yellow-600" },
            { label: "Có phép", count: counts.EXCUSED, color: "text-blue-600" },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-canvas border border-hairline rounded-lg px-4 py-3 shadow-sm text-center">
              <p className={`text-2xl font-bold font-tagline ${color}`}>{count}</p>
              <p className="text-xs font-caption text-ink-muted-80 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Result Banner */}
      {submitResult && (
        <div className={`px-4 py-3 rounded-lg text-sm font-caption border ${submitResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
          {submitResult.message}
        </div>
      )}

      {/* Student List */}
      <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
          <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Danh sách học viên ({students.length} học viên)
          </h2>
          {students.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isPending || students.length === 0}
              className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-body-strong transition-colors disabled:opacity-50"
            >
              {isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
              Lưu điểm danh
            </button>
          )}
        </div>

        {loadingStudents ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-ink-muted-80">Đang tải danh sách...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center">
            <CheckSquare className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">Chọn lớp luyện thi để bắt đầu điểm danh học viên.</p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {students.map((student, index) => (
              <div key={student.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-pearl transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-caption text-ink-muted-48 w-6">{index + 1}</span>
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-body-strong text-ink">{student.name}</p>
                    <p className="text-xs font-caption text-ink-muted-48">{student.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {statusButtons.map(({ status, label, icon, classes: btnClasses }) => (
                    <button
                      key={status}
                      onClick={() => setStatus(student.id, status)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-pill border text-xs font-caption-strong transition-all ${btnClasses} ${attendance[student.id] === status ? "ring-2 ring-offset-1 ring-current scale-105 shadow-sm" : "opacity-60"}`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
