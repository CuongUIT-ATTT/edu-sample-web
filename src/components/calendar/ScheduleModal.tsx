"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { createSchedule, updateSchedule } from "@/actions/schedules";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { showToast } from "@/components/Toast";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: string;
  currentTeacherProfileId?: string | null;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; code: string }[];
  teachers: { id: string; user: { name: string } }[];
  rooms: { id: string; name: string; capacity?: number | null }[];
  editSchedule?: {
    scheduleId: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string;
    startDate: string;
    endDate?: string;
    recurrence: "NONE" | "WEEKLY" | null;
  } | null;
}

const DAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 7, label: "Chủ nhật" },
];

export default function ScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  currentTeacherProfileId,
  classes,
  subjects,
  teachers,
  rooms,
  editSchedule,
}: ScheduleModalProps) {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);

  // Helper: compute nearest future date for a given dayOfWeek (1=Mon..7=Sun)
  function computeNearestDate(dow: number): string {
    const today = new Date();
    const currentDow = today.getDay() === 0 ? 7 : today.getDay();
    let diff = dow - currentDow;
    if (diff <= 0) diff += 7;
    const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const [startDate, setStartDate] = useState(() => computeNearestDate(1));
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [recurrence, setRecurrence] = useState<"NONE" | "WEEKLY">("NONE");
  const [endDate, setEndDate] = useState("");
  const [ignoreWarning, setIgnoreWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editSchedule) {
      setClassId(editSchedule.classId);
      setSubjectId(editSchedule.subjectId);
      setTeacherId(editSchedule.teacherId);
      setDayOfWeek(editSchedule.dayOfWeek);
      setStartDate(editSchedule.startDate);
      setStartTime(editSchedule.startTime);
      setEndTime(editSchedule.endTime);
      setSelectedRoom(editSchedule.room);
      setRecurrence(editSchedule.recurrence === "WEEKLY" ? "WEEKLY" : "NONE");
      setEndDate(editSchedule.endDate || "");
    } else if (isOpen && !editSchedule) {
      // Reset form for new schedule
      setClassId("");
      setSubjectId("");
      setTeacherId(currentTeacherProfileId ?? "");
      setDayOfWeek(1);
      setStartDate(computeNearestDate(1));
      setStartTime("07:00");
      setEndTime("08:00");
      setSelectedRoom("");
      setRecurrence("NONE");
      setEndDate("");
      setIgnoreWarning(false);
      setWarningMsg(null);
    }
  }, [editSchedule, isOpen]);

  // Auto-sync startDate when dayOfWeek changes by user

  if (!isOpen) return null;

  const isTeacher = role === "TEACHER";

  // Auto-adjust startDate when dayOfWeek changes to match the nearest future date
  const handleDayOfWeekChange = (newDow: number) => {
    setDayOfWeek(newDow);
    setStartDate(computeNearestDate(newDow));
  };

  // Check if selected date matches dayOfWeek
  const dateMatchesDay = (() => {
    if (!startDate) return true;
    const d = new Date(startDate);
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    return dow === dayOfWeek;
  })();

  const handleSubmit = async () => {
    if (!classId || !subjectId || !selectedRoom || !startDate) {
      showToast("Vui lòng nhập đầy đủ thông tin", "warning");
      return;
    }

    if (!dateMatchesDay) {
      showToast("Ngày bắt đầu không khớp với thứ đã chọn. Vui lòng chọn lại.", "warning");
      return;
    }

    if (recurrence === "WEEKLY" && !endDate) {
      showToast("Vui lòng chọn ngày kết thúc cho lịch lặp hàng tuần", "warning");
      return;
    }

    setSubmitting(true);
    try {
      if (editSchedule) {
        // Update existing schedule
        const result = await updateSchedule({
          scheduleId: editSchedule.scheduleId,
          classId,
          subjectId,
          teacherId: isTeacher ? currentTeacherProfileId ?? "" : teacherId,
          dayOfWeek,
          startTime,
          endTime,
          room: selectedRoom,
          date: startDate,
          updateMode: "ALL_FUTURE",
          ignoreWarning,
        });
        if (result.success) {
          showToast("Cập nhật lịch học thành công!", "success");
          onSuccess();
          onClose();
        } else if ("isWarning" in result && result.isWarning) {
          setWarningMsg(result.error);
        } else {
          showToast(result.error || "Lỗi cập nhật lịch học", "error");
        }
      } else {
        // Create new schedule
        const result = await createSchedule({
          classId,
          subjectId,
          teacherId: isTeacher ? currentTeacherProfileId ?? "" : teacherId,
          dayOfWeek,
          startTime,
          endTime,
          room: selectedRoom,
          startDate,
          endDate: recurrence === "WEEKLY" ? endDate : undefined,
          recurrence,
          ignoreWarning,
        });

        if (result.success) {
          showToast("Đăng ký lịch học thành công!", "success");
          onSuccess();
          onClose();
        } else if ("isWarning" in result && result.isWarning) {
          setWarningMsg(result.error);
        } else {
          showToast(result.error || "Lỗi đăng ký lịch học", "error");
        }
      }
    } catch {
      showToast("Lỗi server khi đăng ký lịch học", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setClassId("");
    setSubjectId("");
    setTeacherId(currentTeacherProfileId ?? "");
    setDayOfWeek(1);
    setStartDate(new Date().toISOString().split("T")[0]);
    setStartTime("07:00");
    setEndTime("08:00");
    setSelectedRoom("");
    setRecurrence("NONE");
    setEndDate("");
    setIgnoreWarning(false);
    setWarningMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-auto">
        {warningMsg && (
          <div className="m-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-amber-800">{warningMsg}</div>
            <button onClick={() => setWarningMsg(null)} className="text-amber-500 hover:text-amber-700 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-b border-hairline">
          <h3 className="text-base font-semibold text-ink">Đăng ký lịch học</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted-48 hover:bg-surface-pearl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Class */}
          <div>
            <label className="text-xs font-medium text-ink-muted-80 block mb-1">Lớp học *</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}
              className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
              <option value="">Chọn lớp...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-ink-muted-80 block mb-1">Môn học *</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
              className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
              <option value="">Chọn môn...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          {/* Teacher (hidden for teacher role) */}
          {!isTeacher && (
            <div>
              <label className="text-xs font-medium text-ink-muted-80 block mb-1">Giáo viên *</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
                <option value="">Chọn giáo viên...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
          )}

          {/* Day + Start date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-muted-80 block mb-1">Thứ *</label>
              <select value={dayOfWeek} onChange={(e) => handleDayOfWeekChange(Number(e.target.value))}
                className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted-80 block mb-1">Ngày bắt đầu *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className={`w-full text-sm border rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 ${!dateMatchesDay ? "border-red-400 bg-red-50" : "border-hairline"}`} />
              {!dateMatchesDay && (
                <p className="text-[10px] text-red-500 mt-1">Ngày không khớp với thứ đã chọn</p>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink-muted-80 block mb-1">Giờ bắt đầu *</label>
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted-80 block mb-1">Giờ kết thúc *</label>
              <select value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Room */}
          <div>
            <label className="text-xs font-medium text-ink-muted-80 block mb-1">Phòng học *</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
              <option value="">Chọn phòng...</option>
              {rooms.map((r) => <option key={r.id} value={r.name}>{r.name}{r.capacity ? ` (${r.capacity} HS)` : ""}</option>)}
            </select>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-xs font-medium text-ink-muted-80 block mb-1">Lặp lại</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRecurrence("NONE")}
                className={`flex-1 text-sm py-1.5 rounded-lg border transition-colors ${recurrence === "NONE" ? "bg-blue-600 text-white border-blue-600" : "border-hairline text-ink-muted-48 hover:border-blue-300"}`}>
                Chỉ 1 buổi
              </button>
              <button type="button" onClick={() => setRecurrence("WEEKLY")}
                className={`flex-1 text-sm py-1.5 rounded-lg border transition-colors ${recurrence === "WEEKLY" ? "bg-blue-600 text-white border-blue-600" : "border-hairline text-ink-muted-48 hover:border-blue-300"}`}>
                Hàng tuần
              </button>
            </div>
          </div>

          {recurrence === "WEEKLY" && (
            <div>
              <label className="text-xs font-medium text-ink-muted-80 block mb-1">Ngày kết thúc *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-hairline">
          {warningMsg && (
            <button onClick={() => { setIgnoreWarning(true); setWarningMsg(null); }}
              className="px-4 py-1.5 text-sm rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
              Bỏ qua cảnh báo
            </button>
          )}
          <button onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-lg border border-hairline text-ink hover:bg-surface-pearl transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </div>
      </div>
    </div>
  );
}
