/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Clock, MapPin, User, Plus, Trash2, CheckCircle, AlertTriangle, AlertCircle, X, Calendar } from "lucide-react";
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
  rooms: { id: string; name: string; capacity?: number | null }[];
  isTeacherRole?: boolean; // If true, hide schedules info that this teacher doesn't teach
  currentTeacherProfileId?: string;
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

const HOUR_LABELS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00", "22:00"
];

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
  return parts[0] * 60 + parts[1];
}

export default function WeeklyTimetable({ 
  initialSchedules, 
  classes, 
  subjects, 
  teachers,
  rooms,
  isTeacherRole = false,
  currentTeacherProfileId = ""
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
  const [teacherId, setTeacherId] = useState(isTeacherRole ? currentTeacherProfileId : "");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

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

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement> | null, ignoreWarning = false) => {
    if (e) e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      classId,
      subjectId,
      teacherId: isTeacherRole ? currentTeacherProfileId : teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room: selectedRoom,
      ignoreWarning,
    };

    const res = await createSchedule(payload);
    if (res.success) {
      setSuccessMsg(res.message || "Tạo lịch thành công.");
      setWarningMsg(null);
      setPendingInput(null);
      window.location.reload();
    } else if (res.isWarning) {
      setWarningMsg(res.error || "Phát hiện trùng lịch học.");
      setPendingInput(payload);
    } else {
      setErrorMsg(res.error || "Đã xảy ra lỗi.");
    }
  };

  const handleConfirmOverride = () => {
    if (pendingInput) {
      handleFormSubmit(null, true);
    }
  };

  // Google Calendar Overlap Algorithm
  const processedSchedulesByDay = (day: number) => {
    const daySchedules = schedules.filter((s) => s.dayOfWeek === day);
    const parsed = daySchedules.map((s) => {
      const startMin = parseTimeToMinutes(s.startTime);
      const endMin = parseTimeToMinutes(s.endTime);
      return {
        ...s,
        startMin: startMin === -1 ? 480 : startMin, // 08:00
        endMin: endMin === -1 ? 570 : endMin,       // 09:30
        top: 0,
        height: 0,
        left: 0,
        width: 100,
      };
    });

    // Sort: startTime asc, duration desc
    parsed.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

    // View boundaries: 07:00 (420 mins) to 22:00 (1320 mins)
    const viewStart = 420;
    const viewEnd = 1320;
    const viewRange = viewEnd - viewStart;

    parsed.forEach((e) => {
      const start = Math.max(viewStart, Math.min(viewEnd, e.startMin));
      const end = Math.max(viewStart, Math.min(viewEnd, e.endMin));
      e.top = ((start - viewStart) / viewRange) * 100;
      e.height = ((end - start) / viewRange) * 100;
    });

    // Cluster overlaps
    const clusters: typeof parsed[] = [];
    parsed.forEach((e) => {
      let placed = false;
      for (const c of clusters) {
        const clusterStart = Math.min(...c.map((item) => item.startMin));
        const clusterEnd = Math.max(...c.map((item) => item.endMin));
        if (e.startMin < clusterEnd && e.endMin > clusterStart) {
          c.push(e);
          placed = true;
          break;
        }
      }
      if (!placed) {
        clusters.push([e]);
      }
    });

    // Assign left and width side-by-side columns
    clusters.forEach((c) => {
      const columns: typeof parsed[] = [];
      c.forEach((e) => {
        let colIdx = 0;
        while (true) {
          if (!columns[colIdx]) {
            columns[colIdx] = [e];
            break;
          }
          const overlaps = columns[colIdx].some((item) => 
            e.startMin < item.endMin && e.endMin > item.startMin
          );
          if (!overlaps) {
            columns[colIdx].push(e);
            break;
          }
          colIdx++;
        }
      });

      const totalCols = columns.length;
      columns.forEach((col, colIdx) => {
        col.forEach((e) => {
          e.left = (colIdx / totalCols) * 100;
          e.width = 100 / totalCols;
        });
      });
    });

    return parsed;
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

      {/* TIMETABLE GRID (GOOGLE CALENDAR DESIGN) */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-tagline text-xl font-semibold text-ink">Giao diện lịch học Google Calendar</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Các ca trùng giờ tự động xếp ngang hàng nhau</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-4 shadow-sm overflow-x-auto min-w-[850px]">
          <div className="flex">
            {/* Hour axis indicator column */}
            <div className="w-14 flex-shrink-0 border-r border-divider-soft pr-2 pt-10 text-right text-[10px] font-mono text-ink-muted-48 flex flex-col justify-between h-[500px]">
              {HOUR_LABELS.map((hl) => (
                <div key={hl} className="h-4">{hl}</div>
              ))}
            </div>

            {/* Timetable Grid Area */}
            <div className="flex-1 grid grid-cols-7 relative">
              {DAYS_OF_WEEK.map((day) => {
                const dayEvents = processedSchedulesByDay(day.value);
                return (
                  <div key={day.value} className="border-r border-divider-soft last:border-0 relative h-[500px] bg-slate-50/20">
                    {/* Header */}
                    <div className="absolute top-0 inset-x-0 h-9 border-b border-divider-soft flex flex-col items-center justify-center bg-surface-pearl">
                      <span className="text-[10px] font-bold text-ink">{day.label}</span>
                      <span className="text-[8px] text-ink-muted-48">{dayEvents.length} ca</span>
                    </div>

                    {/* Timeline Container */}
                    <div className="absolute top-10 bottom-0 inset-x-0 relative">
                      {dayEvents.map((e) => {
                        const isOwn = !isTeacherRole || e.teacher.id === currentTeacherProfileId;
                        const displayTitle = isOwn ? e.class.name : "Đã bận";
                        const displaySub = isOwn ? `${e.subject.name} - ${e.room}` : `Phòng ${e.room}`;
                        const displayTime = `${e.startTime} - ${e.endTime}`;

                        return (
                          <div
                            key={e.id}
                            style={{
                              top: `${e.top}%`,
                              height: `${e.height}%`,
                              left: `${e.left}%`,
                              width: `${e.width - 2}%`,
                            }}
                            className={`absolute border rounded p-1.5 flex flex-col justify-between overflow-hidden text-[9px] transition-all group hover:z-20 ${
                              isOwn
                                ? "bg-blue-50/90 hover:bg-blue-100 border-blue-200 text-blue-800"
                                : "bg-gray-100/90 border-gray-300 text-gray-600"
                            }`}
                            title={`${displayTitle} (${displayTime})`}
                          >
                            <div className="flex flex-col leading-tight">
                              <span className="font-bold truncate">{displayTitle}</span>
                              <span className="opacity-80 truncate mt-0.5">{displaySub}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-[8px] opacity-75 mt-1 font-mono">
                              <span>{e.startTime}</span>
                              {isOwn && (
                                <button
                                  onClick={() => handleDelete(e.id, `${e.class.name} - ${e.subject.name}`)}
                                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAP WARNING DIALOG */}
      {warningMsg && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[450px] shadow-product p-6 flex flex-col gap-4 animate-fade-in">
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
                {schedules.map((s) => {
                  const isOwn = !isTeacherRole || s.teacher.id === currentTeacherProfileId;
                  return (
                    <tr key={s.id} className="hover:bg-surface-pearl/50">
                      <td className="p-3 font-semibold">{isOwn ? s.class.name : "Đã bận"}</td>
                      <td className="p-3 font-semibold text-primary">{isOwn ? s.subject.name : "—"}</td>
                      <td className="p-3">Thứ {s.dayOfWeek + 1} ({s.startTime} - {s.endTime})</td>
                      <td className="p-3">{isOwn ? s.teacher.user.name : "Giảng viên khác"}</td>
                      <td className="p-3">{s.room || "—"}</td>
                      <td className="p-3 text-center">
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(s.id, `${s.class.name} - ${s.subject.name}`)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

              {!isTeacherRole && (
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
              )}

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
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                >
                  <option value="">— Chọn phòng học —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.name}>{r.name} (Sức chứa: {r.capacity || "KGH"})</option>
                  ))}
                </select>
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
