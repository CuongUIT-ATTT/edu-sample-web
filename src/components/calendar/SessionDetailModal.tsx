"use client";

import { useState, useEffect } from "react";
import {
  X, ExternalLink, BookOpen, GraduationCap, Upload,
  CheckCircle, XCircle, Clock, Users, Trash2, Edit3,
} from "lucide-react";
import {
  updateScheduleFiles,
  submitHomework,
  getHomeworkSubmissionsWithStudents,
  getStudentSubmission,
} from "@/actions/homework";
import { deleteSchedule } from "@/actions/schedules";
import { showToast } from "@/components/Toast";

interface ScheduleBlock {
  isRecurrenceInstance?: boolean;
  recurrenceRule?: string | null;
  scheduleMeta: {
    scheduleId: string; // seriesId
    instanceDate: string; // YYYY-MM-DD
    seriesEndDate?: string | null; // YYYY-MM-DD hoặc null (vô hạn)
    className: string;
    subjectName: string;
    teacherName: string;
    room: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    materials: string | null;
    homework: string | null;
    homeworkQuizId: string | null;
    homeworkQuizTitle: string | null;
    homeworkDueDate: Date | string | null;
  };
  start: Date;
  end: Date;
}

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleBlock | null;
  role: string;
  onUpdate: () => void;
  onEditSchedule?: () => void;
}

interface Submission {
  studentId: string;
  studentName: string;
  studentEmail: string;
  submitted: boolean;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string | Date | null;
  grade: number | null;
  feedback: string | null;
}

const DAYS = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

export default function SessionDetailModal({
  isOpen,
  onClose,
  schedule,
  role,
  onUpdate,
  onEditSchedule,
}: SessionDetailModalProps) {
  const [materials, setMaterials] = useState("");
  const [homework, setHomework] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitFileName, setSubmitFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentSubmission, setStudentSubmission] = useState<Submission | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isTeacherOrAdmin = role === "ADMIN" || role === "TEACHER";
  const isStudent = role === "STUDENT";

  const loadSubmissions = async (scheduleId: string, instanceDate: string) => {
    setLoadingSubmissions(true);
    try {
      if (isTeacherOrAdmin) {
        const result = await getHomeworkSubmissionsWithStudents(scheduleId, instanceDate);
        if (result.success && result.data) {
          setSubmissions(result.data as Submission[]);
        }
      } else if (isStudent) {
        const result = await getStudentSubmission(scheduleId, instanceDate);
        if (result.success && result.data) {
          const d = result.data as Record<string, unknown>;
          setStudentSubmission({
            studentId: "",
            studentName: "",
            studentEmail: "",
            submitted: true,
            fileUrl: d.fileUrl as string,
            fileName: (d.fileName as string) || "Bài nộp",
            submittedAt: d.submittedAt as string | Date,
            grade: d.grade as number | null,
            feedback: d.feedback as string | null,
          });
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (schedule) {
      setMaterials(schedule.scheduleMeta.materials || "");
      setHomework(schedule.scheduleMeta.homework || "");
      setDueDate(
        schedule.scheduleMeta.homeworkDueDate
          ? new Date(schedule.scheduleMeta.homeworkDueDate).toISOString().slice(0, 16)
          : ""
      );
      setSubmitUrl("");
      setSubmitFileName("");
      setSubmissions([]);
      setStudentSubmission(null);
      loadSubmissions(schedule.scheduleMeta.scheduleId, schedule.scheduleMeta.instanceDate);
    }
  }, [schedule]);

  if (!isOpen || !schedule) return null;

  const meta = schedule.scheduleMeta;
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  const handleSaveMaterials = async () => {
    setSaving(true);
    try {
      const result = await updateScheduleFiles({ seriesId: meta.scheduleId, instanceDate: meta.instanceDate, materials });
      if (result.success) {
        showToast("Đã cập nhật bài giảng!", "success");
        onUpdate();
      } else {
        showToast(result.error || "Lỗi cập nhật", "error");
      }
    } catch {
      showToast("Lỗi server", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHomework = async () => {
    setSaving(true);
    try {
      const result = await updateScheduleFiles({
        seriesId: meta.scheduleId,
        instanceDate: meta.instanceDate,
        homework,
        homeworkDueDate: dueDate || null,
      });
      if (result.success) {
        showToast("Đã cập nhật BTVN!", "success");
        onUpdate();
      } else {
        showToast(result.error || "Lỗi cập nhật", "error");
      }
    } catch {
      showToast("Lỗi server", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitHomework = async () => {
    if (!submitUrl.trim()) {
      showToast("Vui lòng nhập link bài nộp", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitHomework({
        seriesId: meta.scheduleId,
        instanceDate: meta.instanceDate,
        fileUrl: submitUrl,
        fileName: submitFileName || "Bài nộp",
      });
      if (result.success) {
        showToast("Nộp bài thành công!", "success");
        setSubmitUrl("");
        setSubmitFileName("");
        loadSubmissions(meta.scheduleId, meta.instanceDate);
        onUpdate();
      } else {
        showToast(result.error || "Lỗi nộp bài", "error");
      }
    } catch {
      showToast("Lỗi server", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDueDate = (d: Date | string | null) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleDeleteSchedule = async (deleteMode: "ONLY_THIS" | "ALL_FUTURE") => {
    setDeleting(true);
    try {
      const result = await deleteSchedule({
        seriesId: meta.scheduleId,
        instanceDate: meta.instanceDate,
        deleteMode,
      });
      if (result.success) {
        showToast("Đã xóa lịch học!", "success");
        setShowDeleteConfirm(false);
        onUpdate();
        onClose();
      } else {
        showToast(result.error || "Lỗi xóa lịch học", "error");
      }
    } catch {
      showToast("Lỗi server", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hairline">
          <div>
            <h3 className="text-base font-semibold text-ink">{meta.subjectName}</h3>
            <p className="text-xs text-ink-muted-48 mt-0.5">
              {DAYS[meta.dayOfWeek]} {meta.startTime} – {meta.endTime} | {meta.room || "Chưa có phòng"}
            </p>
            {schedule?.isRecurrenceInstance && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                Lặp lại hàng tuần
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isTeacherOrAdmin && schedule?.isRecurrenceInstance && (
              <button
                onClick={() => { onEditSchedule?.(); }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="Chỉnh sửa toàn bộ chuỗi lịch"
              >
                Sửa toàn chuỗi
              </button>
            )}
            {isTeacherOrAdmin && !schedule?.isRecurrenceInstance && (
              <button
                onClick={() => { onEditSchedule?.(); }}
                className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Chỉnh sửa lịch học"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Xóa lịch học"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted-48 hover:bg-surface-pearl">
              <X className="w-4 h-4" />
            </button>
        </div>
          </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-ink-muted-48">
            <span>Lớp: <strong className="text-ink">{meta.className}</strong></span>
            <span>|</span>
            <span>GV: <strong className="text-ink">{meta.teacherName}</strong></span>
          </div>

          {/* Materials */}
          <div className="border border-hairline rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-ink">Bài giảng / Tài liệu</span>
            </div>
            {isTeacherOrAdmin ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Dán link tài liệu (Google Drive, OneDrive...)"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  className="flex-1 text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                />
                <button onClick={handleSaveMaterials} disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "..." : "Lưu"}
                </button>
              </div>
            ) : meta.materials ? (
              <a href={meta.materials} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Xem tài liệu bài giảng
              </a>
            ) : (
              <p className="text-xs text-ink-muted-48">Chưa có tài liệu</p>
            )}
          </div>

          {/* Homework */}
          <div className="border border-hairline rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-ink">Bài tập về nhà (BTVN)</span>
              {dueDate && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isOverdue ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                  Hạn: {formatDueDate(dueDate)}
                </span>
              )}
            </div>

            {isTeacherOrAdmin ? (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="Link bài tập (Google Drive, OneDrive...)"
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  className="w-full text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                />
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-ink-muted-48 shrink-0">Hạn nộp:</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="flex-1 text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                  />
                </div>
                {meta.homeworkQuizId && (
                  <p className="text-[11px] text-ink-muted-48">Linked quiz: <strong>{meta.homeworkQuizTitle}</strong></p>
                )}
                <button onClick={handleSaveHomework} disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  {saving ? "..." : "Lưu BTVN"}
                </button>
              </div>
            ) : (
              <>
                {meta.homework ? (
                  <a href={meta.homework} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> Xem bài tập
                  </a>
                ) : (
                  <p className="text-xs text-ink-muted-48">Chưa có bài tập</p>
                )}
              </>
            )}

            {/* Submit homework (student only) */}
            {isStudent && (
              <div className="mt-3 border-t border-hairline pt-3">
                {studentSubmission ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Đã nộp bài — {formatDueDate(studentSubmission.submittedAt)}</span>
                  </div>
                ) : (
                  <>
                    {isOverdue && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Đã quá hạn nộp bài
                      </p>
                    )}
                    <p className="text-xs font-medium text-ink mb-2">Nộp bài:</p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Link bài nộp (Google Drive...)"
                        value={submitUrl}
                        onChange={(e) => setSubmitUrl(e.target.value)}
                        className="flex-1 text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                      />
                      <button onClick={handleSubmitHomework} disabled={submitting}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        {submitting ? "..." : "Nộp"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submissions tracking (teacher/admin only) */}
          {isTeacherOrAdmin && (
            <div className="border border-hairline rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-semibold text-ink">Danh sách nộp bài</span>
                <span className="text-[10px] text-ink-muted-48 bg-surface-pearl px-1.5 py-0.5 rounded-full">
                  {submissions.filter(s => s.submitted).length}/{submissions.length} đã nộp
                </span>
              </div>

              {loadingSubmissions ? (
                <p className="text-xs text-ink-muted-48">Đang tải...</p>
              ) : submissions.length === 0 ? (
                <p className="text-xs text-ink-muted-48">Lớp này chưa có học viên</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-auto">
                  {submissions.map((sub) => (
                    <div key={sub.studentId} className="flex items-center justify-between text-xs p-2 rounded">
                      {sub.submitted ? (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-medium text-ink truncate">{sub.studentName}</span>
                            <span className="text-ink-muted-48 shrink-0">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                          {sub.fileUrl && (
                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-500 hover:underline shrink-0 ml-2">
                              Xem
                            </a>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <XCircle className="w-3.5 h-3.5 text-red-300 shrink-0" />
                          <span className="font-medium text-ink-muted-48 truncate">{sub.studentName}</span>
                          <span className="text-[10px] text-red-400 shrink-0">Chưa nộp</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-50 rounded-xl">
            <div className="p-6 text-center max-w-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h4 className="text-base font-semibold text-ink mb-2">Xóa lịch học</h4>
              <p className="text-sm text-ink-muted-48 mb-4">
                "{meta.subjectName}" — {DAYS[meta.dayOfWeek]} {meta.startTime}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleDeleteSchedule("ONLY_THIS")}
                  disabled={deleting}
                  className="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Đang xóa..." : "Chỉ xóa buổi học này"}
                </button>
                <button
                  onClick={() => handleDeleteSchedule("ALL_FUTURE")}
                  disabled={deleting}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Đang xóa..." : "Xóa buổi này và các buổi sau"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="w-full px-4 py-2 text-sm font-medium text-ink border border-hairline rounded-lg hover:bg-surface-pearl transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
