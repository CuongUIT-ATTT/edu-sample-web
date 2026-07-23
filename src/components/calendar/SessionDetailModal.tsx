"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, BookOpen, GraduationCap, Upload } from "lucide-react";
import { updateScheduleFiles, submitHomework } from "@/actions/homework";
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
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitFileName, setSubmitFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isTeacherOrAdmin = role === "ADMIN" || role === "TEACHER";
  const isStudent = role === "STUDENT";

  useEffect(() => {
    if (schedule) {
      setMaterials(schedule.scheduleMeta.materials || "");
      setHomework(schedule.scheduleMeta.homework || "");
      setSubmitUrl("");
      setSubmitFileName("");
    }
  }, [schedule]);

  if (!isOpen || !schedule) return null;

  const meta = schedule.scheduleMeta;

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
      const result = await updateScheduleFiles({ scheduleId: meta.scheduleId, homework });
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
                <button
                  onClick={handleSaveMaterials}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
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
                {meta.homeworkQuizId && (
                  <p className="text-[11px] text-ink-muted-48">Linked quiz: <strong>{meta.homeworkQuizTitle}</strong></p>
                )}
                <button
                  onClick={handleSaveHomework}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                >
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
                <p className="text-xs font-medium text-ink mb-2">Nộp bài:</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Link bài nộp (Google Drive...)"
                    value={submitUrl}
                    onChange={(e) => setSubmitUrl(e.target.value)}
                    className="flex-1 text-sm border border-hairline rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSubmitHomework}
                    disabled={submitting}
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    {submitting ? "..." : "Nộp"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
