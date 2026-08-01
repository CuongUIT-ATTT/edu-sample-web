"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  CheckSquare,
  RefreshCw,
  Check,
  X,
  Clock,
  BookOpen,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { markAttendance } from "@/actions/attendance";
import { AttendanceStatus } from "@prisma/client";

interface AdminStudent {
  id: string;
  userId: string;
  user: { name: string };
}

interface AdminClass {
  id: string;
  name: string;
  gradeLevel: number;
  students: AdminStudent[];
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  remarks?: string | null;
}

const STATUS_BUTTONS: {
  status: AttendanceStatus;
  label: string;
  icon: React.ReactNode;
  classes: string;
}[] = [
  {
    status: "PRESENT",
    label: "Có mặt",
    icon: <Check className="h-3 w-3" />,
    classes: "bg-green-50 text-green-700 border-green-300 hover:bg-green-100",
  },
  {
    status: "ABSENT",
    label: "Vắng",
    icon: <X className="h-3 w-3" />,
    classes: "bg-red-50 text-red-700 border-red-300 hover:bg-red-100",
  },
  {
    status: "LATE",
    label: "Trễ",
    icon: <Clock className="h-3 w-3" />,
    classes: "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100",
  },
  {
    status: "EXCUSED",
    label: "Phép",
    icon: <BookOpen className="h-3 w-3" />,
    classes: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100",
  },
];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AttendanceAdminClient({
  initialClasses,
}: {
  initialClasses: AdminClass[];
}) {
  const [selectedClassId, setSelectedClassId] = useState(
    initialClasses[0]?.id ?? "",
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateString(new Date()),
  );
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [savedRecords, setSavedRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const activeClass = initialClasses.find((c) => c.id === selectedClassId);

  // Load existing attendance records for selected class + date
  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;
    setLoading(true);
    fetch(
      `/api/admin/attendance?classId=${encodeURIComponent(selectedClassId)}&date=${selectedDate}`,
    )
      .then((r) => r.json())
      .then((data) => {
        const records: AttendanceRecord[] = data.records || [];
        setSavedRecords(records);
        // Seed current status map from saved records, default PRESENT otherwise
        const map: Record<string, AttendanceStatus> = {};
        records.forEach((r) => {
          map[r.studentId] = r.status;
        });
        setAttendance(map);
        setSubmitResult(null);
      })
      .catch((err) => console.error("Error loading attendance:", err))
      .finally(() => setLoading(false));
  }, [selectedClassId, selectedDate]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = () => {
    if (!activeClass || !selectedDate) return;
    setSubmitResult(null);
    startTransition(async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const student of activeClass.students) {
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
            ? `✅ Đã lưu điểm danh cho ${successCount} học viên ngày ${new Date(selectedDate).toLocaleDateString("vi-VN")}.`
            : `⚠️ Lưu thành công ${successCount}, thất bại ${errorCount} học viên.`,
      });
    });
  };

  const counts = {
    PRESENT: Object.values(attendance).filter((s) => s === "PRESENT").length,
    ABSENT: Object.values(attendance).filter((s) => s === "ABSENT").length,
    LATE: Object.values(attendance).filter((s) => s === "LATE").length,
    EXCUSED: Object.values(attendance).filter((s) => s === "EXCUSED").length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Selectors: class + date */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">
            Chọn lớp học
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-11 text-sm text-ink outline-none focus:border-primary-focus w-full"
          >
            {initialClasses.length === 0 ? (
              <option>Chưa có lớp nào</option>
            ) : (
              initialClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (khối {c.gradeLevel})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">
            Chọn ngày
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-11 text-sm text-ink outline-none focus:border-primary-focus w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-caption-strong text-ink-muted-48 uppercase">
            Số học viên
          </span>
          <span className="text-sm font-semibold text-primary h-11 flex items-center gap-1.5 px-3 bg-blue-50 border border-blue-200 rounded-pill">
            <Calendar className="h-4 w-4" /> {activeClass?.students.length ?? 0}
          </span>
        </div>
      </div>

      {/* Admin notice: no time restriction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
        <ShieldAlert className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-muted-80 leading-relaxed">
          Với vai trò Quản trị viên, bạn có thể điểm danh bất cứ lúc nào — không
          bị giới hạn khung thời gian như giảng viên.
        </p>
      </div>

      {/* Quick stats */}
      {activeClass && activeClass.students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Có mặt", count: counts.PRESENT, color: "text-green-600" },
            { label: "Vắng mặt", count: counts.ABSENT, color: "text-red-600" },
            { label: "Đi trễ", count: counts.LATE, color: "text-yellow-600" },
            { label: "Có phép", count: counts.EXCUSED, color: "text-blue-600" },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="bg-canvas border border-hairline rounded-lg px-4 py-3 shadow-sm text-center"
            >
              <p className={`text-2xl font-bold font-tagline ${color}`}>
                {count}
              </p>
              <p className="text-xs font-caption text-ink-muted-80 mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Result banner */}
      {submitResult && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-caption border ${submitResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}
        >
          {submitResult.message}
        </div>
      )}

      {/* Student list */}
      <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
          <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Danh sách học viên ({activeClass?.students.length ?? 0} học viên)
          </h2>
          {activeClass && activeClass.students.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isPending || loading}
              className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-body-strong transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckSquare className="h-3.5 w-3.5" />
              )}
              Lưu điểm danh
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-ink-muted-80">Đang tải danh sách...</p>
          </div>
        ) : !activeClass || activeClass.students.length === 0 ? (
          <div className="p-16 text-center">
            <CheckSquare className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">
              Chọn lớp học ở trên để tiến hành điểm danh.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {activeClass.students.map((student, index) => {
              const saved = savedRecords.find(
                (r) => r.studentId === student.id,
              );
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-surface-pearl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-caption text-ink-muted-48 w-6">
                      {index + 1}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {student.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-body-strong text-ink truncate">
                        {student.user.name}
                      </p>
                      <p className="text-xs font-caption text-ink-muted-48">
                        {saved
                          ? `Đã lưu: ${STATUS_BUTTONS.find((b) => b.status === saved.status)?.label ?? saved.status}`
                          : "Chưa điểm danh"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {STATUS_BUTTONS.map(
                      ({ status, label, icon, classes: btnClasses }) => (
                        <button
                          key={status}
                          onClick={() => setStatus(student.id, status)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-pill border text-xs font-caption-strong transition-all ${btnClasses} ${attendance[student.id] === status ? "ring-2 ring-offset-1 ring-current scale-105 shadow-sm" : "opacity-60"}`}
                        >
                          {icon} {label}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
