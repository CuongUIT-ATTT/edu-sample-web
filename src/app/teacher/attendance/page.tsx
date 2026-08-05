"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  CheckSquare,
  RefreshCw,
  Check,
  X,
  Clock,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { markAttendance } from "@/actions/attendance";
import { AttendanceStatus } from "@prisma/client";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ScheduleItem {
  id: string;
  dayOfWeek: number; // 1 = Mon, ..., 7 = Sun
  startTime: string;
  endTime: string;
  room?: string | null;
  date?: string | null; // ngày thật của buổi học (ISO từ API)
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
}

const DAYS_NAME: Record<number, string> = {
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
  7: "Chủ Nhật",
};

// YYYY-MM-DD theo ngày lịch local — khớp markAttendance (local midnight) và GET /api/admin/attendance
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Label option ngắn gọn (tránh bị cắt/viết tắt trên mobile):
// "12/08 • Toán (07:00-09:00)" — chi tiết đầy đủ hiển thị ở block "Ca học điểm danh" bên dưới.
function formatScheduleLabel(s: ScheduleItem): string {
  const dateLabel = s.date
    ? new Date(s.date).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })
    : DAYS_NAME[s.dayOfWeek];
  return `${dateLabel} • ${s.subject.name} (${s.startTime} - ${s.endTime})`;
}

export default function TeacherAttendancePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 1. Load teacher schedules
  useEffect(() => {
    setLoadingSchedules(true);
    fetch("/api/teacher/schedules")
      .then((r) => r.json())
      .then((data) => {
        setSchedules(data.schedules || []);
        if (data.schedules && data.schedules.length > 0) {
          // Tự chọn ca có ngày GẦN HÔM NAY nhất (không phải ca đầu danh sách = 3 tuần trước)
          const todayMs = new Date();
          todayMs.setHours(0, 0, 0, 0);
          const closest = [...data.schedules].sort((a, b) => {
            const da = a.date ? Math.abs(new Date(a.date).getTime() - todayMs.getTime()) : Infinity;
            const db = b.date ? Math.abs(new Date(b.date).getTime() - todayMs.getTime()) : Infinity;
            return da - db;
          })[0];
          setSelectedScheduleId(closest?.id ?? data.schedules[0].id);
        }
      })
      .catch((err) => console.error("Error loading schedules:", err))
      .finally(() => setLoadingSchedules(false));
  }, []);

  // Find currently selected schedule object
  const activeSchedule = schedules.find((s) => s.id === selectedScheduleId);

  const checkTimeWindow = () => {
    if (!activeSchedule || !selectedDate)
      return { isAllowed: true, reason: "" };

    const now = new Date();
    const startStr = `${selectedDate}T${activeSchedule.startTime}:00`;
    const endStr = `${selectedDate}T${activeSchedule.endTime}:00`;

    const startDateTime = new Date(startStr);
    const endDateTime = new Date(endStr);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return { isAllowed: true, reason: "" };
    }

    const limitStart = new Date(startDateTime.getTime() - 10 * 60 * 1000);
    const limitEnd = new Date(endDateTime.getTime() + 10 * 60 * 1000);

    const isAllowed = now >= limitStart && now <= limitEnd;

    const limitStartStr = limitStart.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const limitEndStr = limitEnd.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      isAllowed,
      reason: `Ca học này chỉ được phép điểm danh từ ${limitStartStr} đến ${limitEndStr} ngày ${startDateTime.toLocaleDateString("vi-VN")}.`,
    };
  };

  const { isAllowed, reason } = checkTimeWindow();

  // 2. Khi đổi ca học: lấy NGÀY THẬT của ca đó từ s.date (không suy từ dayOfWeek)
  useEffect(() => {
    if (!activeSchedule?.date) return;
    setSelectedDate(toLocalDateString(new Date(activeSchedule.date)));
  }, [selectedScheduleId, activeSchedule]);

  // 3. Load students when class of active schedule changes
  useEffect(() => {
    if (!activeSchedule) return;
    const classId = activeSchedule.class.id;

    setLoadingStudents(true);
    fetch(`/api/teacher/classes/${classId}/students`)
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
      .catch((err) => console.error("Error loading students:", err))
      .finally(() => setLoadingStudents(false));
  }, [activeSchedule]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
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
            ? `✅ Ghi nhận điểm danh thành công cho ${successCount} học viên vào ngày ${new Date(selectedDate).toLocaleDateString("vi-VN")}.`
            : `⚠️ Lưu thành công ${successCount}, thất bại ${errorCount} học viên.`,
      });
    });
  };

  const statusButtons: {
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
      classes:
        "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100",
    },
    {
      status: "EXCUSED",
      label: "Phép",
      icon: <BookOpen className="h-3 w-3" />,
      classes: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100",
    },
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
        <h1 className="font-tagline text-2xl font-semibold text-ink">
          Điểm danh chuyên cần học viên
        </h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Ghi nhận chuyên cần dựa trên các ca học được giao phụ trách
        </p>
      </div>

      {/* Ca học selector */}
      <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
          <label className="text-xs font-caption-strong text-ink-muted-80">
            Chọn ca học phụ trách
          </label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-11 text-sm text-ink outline-none focus:border-primary-focus w-full"
            disabled={loadingSchedules}
          >
            {loadingSchedules ? (
              <option>Đang tải ca học...</option>
            ) : schedules.length === 0 ? (
              <option>Chưa có ca học nào được chỉ định</option>
            ) : (
              schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatScheduleLabel(s)}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Hiển thị thông tin ca học đang điểm danh: thứ, ngày tháng năm, lớp, môn */}
        {activeSchedule && (
          <div className="flex flex-col gap-1.5 md:min-w-[300px]">
            <label className="text-xs font-caption-strong text-ink-muted-80">
              Ca học điểm danh
            </label>
            <div className="text-sm font-semibold text-ink leading-snug">
              {DAYS_NAME[activeSchedule.dayOfWeek]},{" "}
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </div>
            <span className="text-xs text-ink-muted-80 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Lớp {activeSchedule.class.name} • {activeSchedule.subject.name} (
              {activeSchedule.startTime} - {activeSchedule.endTime})
            </span>
          </div>
        )}
      </div>

      {/* Time window lock warning */}
      {activeSchedule && !isAllowed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex gap-3 items-start animate-fade-in">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-ink">
              Ngoài thời gian điểm danh quy định
            </h4>
            <p className="text-xs text-ink-muted-80 mt-1 leading-relaxed">
              {reason} Giảng viên chỉ được phép điểm danh trong khoảng thời gian
              từ 10 phút trước khi bắt đầu ca học cho đến 10 phút sau khi kết
              thúc ca học. Ngoài thời gian này, vui lòng liên hệ Quản trị viên
              để bổ sung hoặc chỉnh sửa.
            </p>
          </div>
        </div>
      )}

      {/* Warning info */}
      {schedules.length === 0 && !loadingSchedules && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 flex gap-3 items-start">
          <ShieldAlert className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-ink">
              Bạn chưa có ca học nào được xếp lịch
            </h4>
            <p className="text-xs text-ink-muted-80 mt-1 leading-relaxed">
              Vui lòng liên hệ Admin để cập nhật thời khoá biểu tuần cho các lớp
              giảng dạy của bạn để có thể thực hiện điểm danh.
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Result Banner */}
      {submitResult && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-caption border ${submitResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}
        >
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
              disabled={isPending || students.length === 0 || !isAllowed}
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

        {loadingStudents ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-ink-muted-80">Đang tải danh sách...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center">
            <CheckSquare className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">
              Chọn ca học ở trên để tiến hành điểm danh.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {students.map((student, index) => (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-4 hover:bg-surface-pearl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-caption text-ink-muted-48 w-6 shrink-0">
                    {index + 1}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-body-strong text-ink truncate">
                      {student.name}
                    </p>
                    <p className="text-xs font-caption text-ink-muted-48 truncate">
                      {student.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {statusButtons.map(
                    ({ status, label, icon, classes: btnClasses }) => (
                      <button
                        key={status}
                        onClick={() => setStatus(student.id, status)}
                        className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-pill border text-[11px] sm:text-xs font-caption-strong transition-all ${btnClasses} ${attendance[student.id] === status ? "ring-2 ring-offset-1 ring-current scale-105 shadow-sm" : "opacity-60"}`}
                      >
                        {icon} <span>{label}</span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
