"use client";

import { useState, useEffect } from "react";
import {
  X, ExternalLink, BookOpen, GraduationCap, Upload,
  CheckCircle, XCircle, Clock, Users,
} from "lucide-react";
import {
  updateScheduleFiles,
  submitHomework,
  getScheduleSubmissions,
  getStudentSubmission,
} from "@/actions/homework";
import { showToast } from "@/components/Toast";

interface ScheduleBlock {
  scheduleMeta: {
    scheduleId: string;
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
}

interface Submission {
  id: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string | Date;
  grade: number | null;
  feedback: string | null;
  student: {
    id: string;
    user: { name: string; email: string };
  };
}

const DAYS = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

export default function SessionDetailModal({
  isOpen,
  onClose,
  schedule,
  role,
  onUpdate,
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

  const isTeacherOrAdmin = role === "ADMIN" || role === "TEACHER";
  const isStudent = role === "STUDENT";

  const loadSubmissions = async (scheduleId: string) => {
    setLoadingSubmissions(true);
    try {
      if (isTeacherOrAdmin) {
        const result = await getScheduleSubmissions(scheduleId);
        if (result.success && result.data) {
          setSubmissions(result.data as Submission[]);
        }
      } else if (isStudent) {
        const result = await getStudentSubmission(scheduleId);
        if (result.success && result.data) {
          const d = result.data as Record<string, unknown>;
          setStudentSubmission({
            id: d.id as string,
            fileUrl: d.fileUrl as string,
            fileName: (d.fileName as string) || "Bài nộp",
            submittedAt: d.submittedAt as string | Date,
            grade: d.grade as number | null,
            feedback: d.feedback as string | null,
            student: { id: "", user: { name: "", email: "" } },
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
      loadSubmissions(schedule.scheduleMeta.scheduleId);
    }
  }, [schedule]);

  if (!isOpen || !schedule) return null;

  const meta = schedule.scheduleMeta;
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  const handleSaveMaterials = async () => {
    setSaving(true);
    try {
      const result = await updateScheduleFiles({ scheduleId: meta.scheduleId, materials });
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
        scheduleId: meta.scheduleId,
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
        scheduleId: meta.scheduleId,
        fileUrl: submitUrl,
        fileName: submitFileName || "Bài nộp",
      });
      if (result.success) {
        showToast("Nộp bài thành công!", "success");
        setSubmitUrl("");
        setSubmitFileName("");
        loadSubmissions(meta.scheduleId);
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
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted-48 hover:bg-surface-pearl">
            <X className="w-4 h-4" />
          </button>
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
              </div>

              {loadingSubmissions ? (
                <p className="text-xs text-ink-muted-48">Đang tải...</p>
              ) : submissions.length === 0 ? (
                <p className="text-xs text-ink-muted-48">Chưa có học viên nào nộp bài</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-auto">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-xs p-2 bg-surface-pearl rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-medium text-ink">{sub.student.user.name}</span>
                        <span className="text-ink-muted-48">({sub.fileName})</span>
                      </div>
                      <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:underline">
                        Xem
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
