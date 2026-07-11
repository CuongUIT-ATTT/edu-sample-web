/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Calendar, Clock, MapPin, User, Plus, Trash2, CheckCircle, AlertTriangle, AlertCircle, X } from "lucide-react";
import { createSchedule, deleteSchedule } from "@/actions/schedules";

interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    user: {
      name: string;
    };
  };
}

interface WeeklyTimetableProps {
  initialSchedules: ScheduleItem[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; code: string }[];
  teachers: { id: string; user: { name: string } }[];
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 7, label: "Chủ Nhật" },
];

export default function WeeklyTimetable({ 
  initialSchedules, 
  classes, 
  subjects, 
  teachers 
}: WeeklyTimetableProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Overlap Warning State
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<any>(null);

  // Form states
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Bạn có chắc muốn xoá ca học ${label}?`)) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    setWarningMsg(null);

    const res = await deleteSchedule(id);
    if (res.success) {
      setSuccessMsg(res.message || "Xoá thành công");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Xoá lịch học thất bại.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, ignoreWarning = false) => {
    if (e) e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      classId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      ignoreWarning,
    };

    const res = await createSchedule(payload);
    if (res.success) {
      setSuccessMsg(res.message || "Tạo lịch thành công.");
      setWarningMsg(null);
      setPendingInput(null);
      window.location.reload();
    } else if (res.isWarning) {
      // Trigger warning confirm modal
      setWarningMsg(res.error || "Phát hiện trùng lịch học.");
      setPendingInput(payload);
    } else {
      setErrorMsg(res.error || "Đã xảy ra lỗi.");
    }
  };

  const handleConfirmOverride = () => {
    if (pendingInput) {
      handleFormSubmit(null as any, true);
    }
  };

  const getSchedulesForDay = (day: number) => {
    return schedules
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Alert Notices */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-3 text-sm">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TIMETABLE GRID */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-tagline text-xl font-semibold text-ink">Thời khóa biểu tuần</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Lịch học chi tiết của các lớp xếp theo các thứ trong tuần</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = getSchedulesForDay(day.value);
            return (
              <div key={day.value} className="bg-canvas border border-hairline rounded-lg p-4 shadow-sm flex flex-col gap-3 min-h-[250px]">
                <div className="border-b border-divider-soft pb-2">
                  <h3 className="font-body-strong font-bold text-ink text-center text-sm">{day.label}</h3>
                  <span className="text-[10px] text-ink-muted-48 block text-center mt-0.5">{daySchedules.length} ca dạy</span>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[400px]">
                  {daySchedules.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center">
                      <p className="text-[11px] text-ink-muted-48 italic font-body">Trống</p>
                    </div>
                  ) : (
                    daySchedules.map((s) => (
                      <div key={s.id} className="bg-surface-pearl border border-divider-soft rounded p-2.5 flex flex-col gap-2 relative group hover:border-primary-focus transition-all text-xs">
                        <button
                          onClick={() => handleDelete(s.id, `${s.class.name} - ${s.subject.name}`)}
                          className="absolute top-1 right-1 p-1 text-red-400 hover:text-red-600 rounded bg-canvas opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xoá ca học"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        
                        <div className="flex flex-col gap-1 pr-3">
                          <span className="font-bold font-tagline text-ink leading-tight">{s.class.name}</span>
                          <span className="text-primary font-semibold">{s.subject.name}</span>
                        </div>

                        <div className="flex flex-col gap-1 text-[10px] text-ink-muted-80 font-body">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.startTime} - {s.endTime}</span>
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> GV: {s.teacher.user.name.split(" ").slice(-2).join(" ")}</span>
                          {s.room && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> P: {s.room}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OVERLAP WARNING DIALOG */}
      {warningMsg && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-full max-w-md shadow-product p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-tagline text-base font-bold text-ink">Phát hiện trùng lịch học!</h3>
                <p className="text-xs text-ink-muted-80 mt-2 leading-relaxed">{warningMsg}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-divider-soft pt-4 mt-2">
              <button
                onClick={() => {
                  setWarningMsg(null);
                  setPendingInput(null);
                }}
                className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2 rounded-pill font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmOverride}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2 rounded-pill font-semibold shadow-sm"
              >
                Bỏ qua &amp; Vẫn tạo lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM AND ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-divider-soft pt-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="font-tagline text-lg font-semibold text-ink">Danh sách ca học chi tiết</h2>
          <p className="font-caption text-ink-muted-80">Bảng danh mục chi tiết tất cả các ca học đã được sắp xếp trong hệ thống</p>
          
          <div className="bg-canvas border border-hairline rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-surface-pearl border-b border-hairline font-caption-strong text-ink-muted-48 uppercase">
                  <th className="p-3">Lớp học</th>
                  <th className="p-3">Môn học</th>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Giảng viên</th>
                  <th className="p-3">Phòng</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-pearl/50">
                    <td className="p-3 font-semibold">{s.class.name}</td>
                    <td className="p-3 font-semibold text-primary">{s.subject.name}</td>
                    <td className="p-3">Thứ {s.dayOfWeek + 1} ({s.startTime} - {s.endTime})</td>
                    <td className="p-3">{s.teacher.user.name}</td>
                    <td className="p-3">{s.room || "—"}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(s.id, `${s.class.name} - ${s.subject.name}`)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
            <h2 className="font-tagline text-lg font-semibold text-ink">Thêm lịch học</h2>
            <p className="font-caption text-ink-muted-80 mt-1">Thiết lập thời gian biểu cho lớp</p>
          </div>

          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
            <form onSubmit={(e) => handleFormSubmit(e)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Lớp học</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                >
                  <option value="">— Chọn lớp —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Môn học</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                >
                  <option value="">— Chọn môn —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Giáo viên giảng dạy</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                >
                  <option value="">— Chọn giáo viên —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Thứ trong tuần</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                >
                  <option value={1}>Thứ Hai (Monday)</option>
                  <option value={2}>Thứ Ba (Tuesday)</option>
                  <option value={3}>Thứ Tư (Wednesday)</option>
                  <option value={4}>Thứ Năm (Thursday)</option>
                  <option value={5}>Thứ Sáu (Friday)</option>
                  <option value={6}>Thứ Bảy (Saturday)</option>
                  <option value={7}>Chủ Nhật (Sunday)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Giờ bắt đầu</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="08:00"
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Giờ kết thúc</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="09:30"
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Phòng học (Room)</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Phòng 302, Studio..."
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                />
              </div>

              <button
                type="submit"
                className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
                Tạo lịch học
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
