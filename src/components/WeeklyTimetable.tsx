/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Upload,
  Download,
  Eye,
  Check,
  X,
  FileText,
  Star,
  Edit3,
  Link as LinkIcon,
} from "lucide-react";
import {
  createSchedule,
  deleteSchedule,
  updateSchedule,
} from "@/actions/schedules";
import {
  updateScheduleFiles,
  submitHomework,
  gradeHomework,
  getScheduleSubmissions,
  getStudentSubmission,
  getClassSessionQuizSubmissions,
} from "@/actions/homework";
import { getAllQuizzesForHomework, getStudentQuizResult } from "@/actions/quizzes";
import { getDayOfWeek, nearestDateForDow } from "@/lib/dateUtils";
import { TIME_SLOTS, addMinutes } from "@/lib/timeSlots";
import { showToast } from "@/components/Toast";

interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  date?: Date | string | null;
  recurrenceGroupId?: string | null;
  materials?: string | null;
  homework?: string | null;
  homeworkDueDate?: Date | string | null;
  homeworkQuizId?: string | null;
  homeworkQuiz?: {
    id: string;
    title: string;
  } | null;
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
  isTeacherRole?: boolean;
  currentTeacherProfileId?: string;
  userRole?: string; // "STUDENT" | "TEACHER" | "ADMIN"
  currentStudentProfileId?: string;
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
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1;
  return parts[0] * 60 + parts[1];
}

const DOW_LABELS: Record<number, string> = {
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
  7: "Chủ Nhật",
};

function findConflicts(schedules: ScheduleItem[]): string[] {
  const conflicts: string[] = [];
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const s1 = schedules[i];
      const s2 = schedules[j];

      // Check if same day / date
      const sameDay = s1.dayOfWeek === s2.dayOfWeek;
      const sameDate =
        s1.date &&
        s2.date &&
        new Date(s1.date).toISOString().split("T")[0] ===
          new Date(s2.date).toISOString().split("T")[0];

      if (sameDay || sameDate) {
        const start1 = parseTimeToMinutes(s1.startTime);
        const end1 = parseTimeToMinutes(s1.endTime);
        const start2 = parseTimeToMinutes(s2.startTime);
        const end2 = parseTimeToMinutes(s2.endTime);
        const timeOverlaps = start1 < end2 && start2 < end1;

        if (timeOverlaps) {
          // Check room conflict
          if (s1.room && s2.room && s1.room.trim() === s2.room.trim()) {
            const dateStr = s1.date
              ? new Date(s1.date).toLocaleDateString("vi-VN")
              : `Thứ ${s1.dayOfWeek + 1}`;
            conflicts.push(
              `Phòng học "${s1.room}" bị trùng lịch vào ${dateStr} (${s1.startTime} - ${s1.endTime}) bởi lớp "${s1.class.name}" và lớp "${s2.class.name}".`
            );
          }
          // Check teacher conflict
          if (s1.teacher.id === s2.teacher.id) {
            const dateStr = s1.date
              ? new Date(s1.date).toLocaleDateString("vi-VN")
              : `Thứ ${s1.dayOfWeek + 1}`;
            conflicts.push(
              `Giảng viên "${s1.teacher.user.name}" bị trùng lịch dạy vào ${dateStr} (${s1.startTime} - ${s1.endTime}) cho lớp "${s1.class.name}" và lớp "${s2.class.name}".`
            );
          }
        }
      }
    }
  }
  return Array.from(new Set(conflicts));
}

export default function WeeklyTimetable({
  initialSchedules,
  classes,
  subjects,
  teachers,
  rooms,
  isTeacherRole = false,
  currentTeacherProfileId = "",
  userRole = "ADMIN",
  currentStudentProfileId = "",
}: WeeklyTimetableProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const useWindowWidth = () => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
      const updateWidth = () => setWidth(window.innerWidth);
      updateWidth();
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }, []);
    return width;
  };
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth > 0 && windowWidth < 768;

  // Calendar States
  const [viewMode, setViewMode] = useState<"DAY" | "WEEK" | "MONTH">("WEEK");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dayViewDate, setDayViewDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Details Modal state
  const [selectedSession, setSelectedSession] = useState<ScheduleItem | null>(
    null,
  );
  const [activeSubmissions, setActiveSubmissions] = useState<any[]>([]);
  const [studentSubmission, setStudentSubmission] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Link input states for Hướng A (Google Drive / Online Link)
  const [materialsUrl, setMaterialsUrl] = useState("");
  const [homeworkUrl, setHomeworkUrl] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [homeworkDueDate, setHomeworkDueDate] = useState("");

  // Quiz homework states
  const [homeworkQuizId, setHomeworkQuizId] = useState("");
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [studentQuizResultScore, setStudentQuizResultScore] = useState<number | null>(null);
  const [quizSubmissionsList, setQuizSubmissionsList] = useState<any[]>([]);

  useEffect(() => {
    if (userRole === "TEACHER" || userRole === "ADMIN") {
      getAllQuizzesForHomework().then((res) => {
        if (res.success && res.data) {
          setQuizzesList(res.data);
        }
      });
    }
  }, [userRole]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  // Grading states
  const [gradingSubmissionId, setGradingSubmissionId] = useState("");
  const [gradingScore, setGradingScore] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");

  // Edit Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editClassId, setEditClassId] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editDayOfWeek, setEditDayOfWeek] = useState(1);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editSelectedRoom, setEditSelectedRoom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  // Deletion choices
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  useEffect(() => {
    if (isMobile) {
      setViewMode("DAY");
    } else if (viewMode === "DAY") {
      setViewMode("WEEK");
    }
  }, [isMobile, viewMode]);
  const [sessionToDelete, setSessionToDelete] = useState<ScheduleItem | null>(
    null,
  );

  // Overlap Warning State
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<any>(null);

  // Form states
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState(
    isTeacherRole ? currentTeacherProfileId : "",
  );
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");
  const [recurrence, setRecurrence] = useState<"NONE" | "WEEKLY">("NONE");
  const [dowMismatch, setDowMismatch] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch homework submissions when modal opens
  useEffect(() => {
    if (!selectedSession) {
      setIsEditing(false);
      return;
    }

    setMaterialsUrl(selectedSession.materials || "");
    setHomeworkUrl(selectedSession.homework || "");
    setHomeworkQuizId(selectedSession.homeworkQuizId || "");
    setHomeworkDueDate(
      selectedSession.homeworkDueDate
        ? new Date(
            new Date(selectedSession.homeworkDueDate).getTime() -
              new Date().getTimezoneOffset() * 60000,
          )
            .toISOString()
            .substring(0, 16)
        : "",
    );
    setIsEditing(false);

    if (userRole === "STUDENT" && selectedSession.homeworkQuizId) {
      setStudentQuizResultScore(null);
      getStudentQuizResult(selectedSession.homeworkQuizId).then((res) => {
        if (res.success && res.data) {
          setStudentQuizResultScore(res.data.score);
        }
      });
    } else {
      setStudentQuizResultScore(null);
    }

    // Pre-fill edit inputs
    setEditClassId(selectedSession.class.id);
    setEditSubjectId(selectedSession.subject.id);
    setEditTeacherId(selectedSession.teacher.id);
    setEditDayOfWeek(selectedSession.dayOfWeek);
    setEditStartTime(selectedSession.startTime);
    setEditEndTime(selectedSession.endTime);
    setEditSelectedRoom(selectedSession.room || "");
    setEditDate(
      selectedSession.date
        ? new Date(selectedSession.date).toISOString().split("T")[0]
        : "",
    );

    setLoadingDetails(true);
    if (userRole === "STUDENT") {
      getStudentSubmission(selectedSession.id)
        .then((res) => {
          if (res.success) {
            setStudentSubmission(res.data);
            setSubmissionUrl(res.data?.fileUrl || "");
          }
        })
    } else {
      setQuizSubmissionsList([]);
      setActiveSubmissions([]);
      setLoadingDetails(true);

      const promises: Promise<any>[] = [];
      
      promises.push(
        getScheduleSubmissions(selectedSession.id).then((res) => {
          if (res.success) setActiveSubmissions(res.data || []);
        })
      );

      if (selectedSession.homeworkQuizId) {
        promises.push(
          getClassSessionQuizSubmissions(selectedSession.id, selectedSession.homeworkQuizId).then((res) => {
            if (res.success && res.data) {
              setQuizSubmissionsList(res.data);
            }
          })
        );
      }

      Promise.all(promises).finally(() => setLoadingDetails(false));
    }
  }, [selectedSession, userRole]);

  const handleDeleteTrigger = (session: ScheduleItem) => {
    setSessionToDelete(session);
    if (session.recurrenceGroupId) {
      setShowDeleteConfirm(true);
    } else {
      if (confirm(`Bạn có chắc chắn muốn xóa ca học này không?`)) {
        handleDeleteExecute(session.id, "ONLY_THIS");
      }
    }
  };

  const handleDeleteExecute = async (
    id: string,
    deleteMode: "ONLY_THIS" | "ALL_FUTURE",
  ) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setWarningMsg(null);
    setShowDeleteConfirm(false);
    setSessionToDelete(null);

    const res = await deleteSchedule(id, deleteMode);
    if (res.success) {
      setSuccessMsg(res.message || "Xoá thành công");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Xoá lịch học thất bại.");
    }
  };

  const handleDeleteGroup = (groupId: string, firstId: string) => {
    if (
      confirm(
        "Bạn có chắc chắn muốn xóa toàn bộ chuỗi ca học lặp lại này? Hành động này không thể hoàn tác."
      )
    ) {
      handleDeleteExecute(firstId, "ALL_FUTURE");
    }
  };

  // On dayOfWeek change: auto-jump startDate to nearest
  // matching date AND clear mismatch warning
  function handleDayOfWeekChange(newDow: number) {
    setDayOfWeek(newDow);
    setStartDate(nearestDateForDow(newDow));
    setDowMismatch(false);
    setFormErrors((prev) => ({ ...prev, startDate: "" }));
  }

  // On startDate change: warn if mismatch, do NOT auto-correct
  // (user may be intentionally picking a specific date)
  function handleStartDateChange(newDate: string) {
    setStartDate(newDate);
    const actualDow = getDayOfWeek(newDate);
    setDowMismatch(actualDow !== dayOfWeek);
    setFormErrors((prev) => ({ ...prev, startDate: "" }));
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!classId) errors.classId = "Vui lòng chọn lớp học";
    if (!subjectId) errors.subjectId = "Vui lòng chọn môn học";
    if (!startDate) errors.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!startTime) errors.startTime = "Vui lòng chọn giờ bắt đầu";
    if (!endTime) errors.endTime = "Vui lòng chọn giờ kết thúc";
    if (!selectedRoom) errors.room = "Vui lòng chọn phòng học";
    if (recurrence === "WEEKLY" && !endDate)
      errors.endDate = "Vui lòng chọn ngày kết thúc lặp";
    return errors;
  }

  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement> | null,
    ignoreWarning = false,
  ) => {
    if (e) e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const payload = {
      classId,
      subjectId,
      teacherId: isTeacherRole ? currentTeacherProfileId : teacherId,
      dayOfWeek,
      startTime,
      endTime,
      room: selectedRoom,
      ignoreWarning,
      startDate,
      endDate: recurrence === "WEEKLY" ? endDate : undefined,
      recurrence,
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
      if (pendingInput.scheduleId) {
        handleUpdateExecute(pendingInput.updateMode, true);
      } else {
        handleFormSubmit(null, true);
      }
    }
  };

  const handleUpdateTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    if (selectedSession.recurrenceGroupId) {
      setShowUpdateConfirm(true);
    } else {
      if (confirm("Bạn có chắc chắn muốn cập nhật ca học này không?")) {
        handleUpdateExecute("ONLY_THIS");
      }
    }
  };

  const handleUpdateExecute = async (
    updateMode: "ONLY_THIS" | "ALL_FUTURE",
    ignoreWarning = false,
  ) => {
    if (!selectedSession) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    setShowUpdateConfirm(false);

    const payload = {
      scheduleId: selectedSession.id,
      classId: editClassId,
      subjectId: editSubjectId,
      teacherId: editTeacherId,
      dayOfWeek: editDayOfWeek,
      startTime: editStartTime,
      endTime: editEndTime,
      room: editSelectedRoom,
      date: editDate,
      updateMode,
      ignoreWarning,
    };

    const res = await updateSchedule(payload);
    if (res.success) {
      setSuccessMsg(res.message || "Cập nhật ca học thành công.");
      setSelectedSession(null);
      window.location.reload();
    } else if (res.isWarning) {
      setWarningMsg(res.error || "Phát hiện trùng lịch học.");
      setPendingInput(payload);
    } else {
      setErrorMsg(res.error || "Cập nhật ca học thất bại.");
    }
  };

  // Date Range Navigation helpers
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const navigatePrevious = () => {
    const next = new Date(currentDate);
    if (viewMode === "WEEK") {
      next.setDate(currentDate.getDate() - 7);
    } else if (viewMode === "DAY") {
      next.setDate(currentDate.getDate() - 1);
    } else {
      next.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(next);
    if (viewMode === "DAY") {
      setDayViewDate(next.toISOString().split("T")[0]);
    }
  };

  const navigateNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "WEEK") {
      next.setDate(currentDate.getDate() + 7);
    } else if (viewMode === "DAY") {
      next.setDate(currentDate.getDate() + 1);
    } else {
      next.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(next);
    if (viewMode === "DAY") {
      setDayViewDate(next.toISOString().split("T")[0]);
    }
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (viewMode === "DAY") {
      setDayViewDate(today.toISOString().split("T")[0]);
    }
  };

  const formatHeaderLabel = () => {
    if (viewMode === "DAY") {
      return new Date(dayViewDate).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    }
    if (viewMode === "WEEK") {
      const mon = getMonday(currentDate);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return `${mon.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })} - ${sun.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  };
  const currentDayDate =
    viewMode === "DAY" ? new Date(dayViewDate) : currentDate;
  const processedSchedulesForDate = (date: Date) => {
    const dayValue = date.getDay() === 0 ? 7 : date.getDay();
    const targetDateStr = date.toISOString().split("T")[0];
    const daySchedules = schedules.filter((s) => {
      if (s.dayOfWeek !== dayValue) return false;
      if (!s.date) return true;
      const sDateStr = new Date(s.date).toISOString().split("T")[0];
      return sDateStr === targetDateStr;
    });
    const parsed = daySchedules.map((s) => {
      const startMin = parseTimeToMinutes(s.startTime);
      const endMin = parseTimeToMinutes(s.endTime);
      return {
        ...s,
        startMin: startMin === -1 ? 480 : startMin,
        endMin: endMin === -1 ? 570 : endMin,
        top: 0,
        height: 0,
        left: 0,
        width: 100,
      };
    });
    parsed.sort(
      (a, b) =>
        a.startMin - b.startMin ||
        b.endMin - b.startMin - (a.endMin - a.startMin),
    );
    const viewStart = 420;
    const viewEnd = 1320;
    parsed.forEach((e) => {
      const start = Math.max(viewStart, Math.min(viewEnd, e.startMin));
      const end = Math.max(viewStart, Math.min(viewEnd, e.endMin));
      e.top = ((start - viewStart) * 2) / 3;
      e.height = ((end - start) * 2) / 3;
    });
    const clusters: (typeof parsed)[] = [];
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
    clusters.forEach((c) => {
      const columns: (typeof parsed)[] = [];
      c.forEach((e) => {
        let colIdx = 0;
        while (true) {
          if (!columns[colIdx]) {
            columns[colIdx] = [e];
            break;
          }
          const overlaps = columns[colIdx].some(
            (item) => e.startMin < item.endMin && e.endMin > item.startMin,
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

  // Google Calendar Overlap Algorithm for WEEK View
  const processedSchedulesByDay = (day: number) => {
    const monday = getMonday(currentDate);
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (day - 1));
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // Filter schedules for target day and date range
    const daySchedules = schedules.filter((s) => {
      if (s.dayOfWeek !== day) return false;
      if (!s.date) return true; // legacy repeats weekly
      const sDateStr = new Date(s.date).toISOString().split("T")[0];
      return sDateStr === targetDateStr;
    });

    const parsed = daySchedules.map((s) => {
      const startMin = parseTimeToMinutes(s.startTime);
      const endMin = parseTimeToMinutes(s.endTime);
      return {
        ...s,
        startMin: startMin === -1 ? 480 : startMin, // 08:00
        endMin: endMin === -1 ? 570 : endMin, // 09:30
        top: 0,
        height: 0,
        left: 0,
        width: 100,
      };
    });

    parsed.sort(
      (a, b) =>
        a.startMin - b.startMin ||
        b.endMin - b.startMin - (a.endMin - a.startMin),
    );

    // View boundaries: 07:00 (420 mins) to 22:00 (1320 mins) -> 900 minutes total.
    // 600px height content area. 1 minute = 600/900 = 2/3 px.
    const viewStart = 420;
    const viewEnd = 1320;

    parsed.forEach((e) => {
      const start = Math.max(viewStart, Math.min(viewEnd, e.startMin));
      const end = Math.max(viewStart, Math.min(viewEnd, e.endMin));
      e.top = ((start - viewStart) * 2) / 3;
      e.height = ((end - start) * 2) / 3;
    });

    // Cluster overlaps
    const clusters: (typeof parsed)[] = [];
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

    clusters.forEach((c) => {
      const columns: (typeof parsed)[] = [];
      c.forEach((e) => {
        let colIdx = 0;
        while (true) {
          if (!columns[colIdx]) {
            columns[colIdx] = [e];
            break;
          }
          const overlaps = columns[colIdx].some(
            (item) => e.startMin < item.endMin && e.endMin > item.startMin,
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

  // Month grid list (35 squares of the selected month)
  const monthDaysGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const grid = [];
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startOffset);

    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      grid.push(d);
    }
    return grid;
  }, [currentDate]);

  // Hướng A handlers: Save online link URLs
  const handleSaveMaterials = async () => {
    if (!selectedSession) return;
    if (!materialsUrl.trim() && selectedSession.materials) {
      if (
        !confirm(
          "Bạn có chắc chắn muốn xóa đường dẫn tài liệu xem trước của ca học này?",
        )
      ) {
        return;
      }
    }
    const res = await updateScheduleFiles({
      scheduleId: selectedSession.id,
      materials: materialsUrl.trim() || null,
    });
    if (res.success) {
      setSelectedSession({
        ...selectedSession,
        materials: materialsUrl.trim() || null,
      });
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, materials: materialsUrl.trim() || null }
            : s,
        ),
      );
      showToast("Đã cập nhật link tài liệu học tập thành công!", "success");
    } else {
      showToast(res.error || "Lỗi cập nhật tài liệu.", "error");
    }
  };

  const handleSaveHomework = async () => {
    if (!selectedSession) return;
    if (!homeworkUrl.trim() && selectedSession.homework) {
      if (
        !confirm(
          "Bạn có chắc chắn muốn xóa đường dẫn bài tập về nhà của ca học này?",
        )
      ) {
        return;
      }
    }
    const res = await updateScheduleFiles({
      scheduleId: selectedSession.id,
      homework: homeworkUrl.trim() || null,
    });
    if (res.success) {
      setSelectedSession({
        ...selectedSession,
        homework: homeworkUrl.trim() || null,
      });
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, homework: homeworkUrl.trim() || null }
            : s,
        ),
      );
      showToast("Đã giao bài tập về nhà thành công!", "success");
    } else {
      showToast(res.error || "Lỗi giao bài tập.", "error");
    }
  };

  const handleSaveQuizHomework = async () => {
    if (!selectedSession) return;
    const res = await updateScheduleFiles({
      scheduleId: selectedSession.id,
      homeworkQuizId: homeworkQuizId || null,
    });
    if (res.success) {
      const selectedQuiz = quizzesList.find((q) => q.id === homeworkQuizId);
      const updatedQuizInfo = selectedQuiz ? { id: selectedQuiz.id, title: selectedQuiz.title } : null;

      setSelectedSession({
        ...selectedSession,
        homeworkQuizId: homeworkQuizId || null,
        homeworkQuiz: updatedQuizInfo,
      });
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, homeworkQuizId: homeworkQuizId || null, homeworkQuiz: updatedQuizInfo }
            : s,
        ),
      );
      showToast("Đã giao bài kiểm tra làm bài tập về nhà thành công!", "success");
    } else {
      showToast(res.error || "Lỗi giao bài tập trắc nghiệm.", "error");
    }
  };

  const handleSaveDueDate = async () => {
    if (!selectedSession) return;
    if (!homeworkDueDate && selectedSession.homeworkDueDate) {
      if (
        !confirm(
          "Bạn có chắc chắn muốn xóa hạn nộp bài tập về nhà của ca học này?",
        )
      ) {
        return;
      }
    }
    const res = await updateScheduleFiles({
      scheduleId: selectedSession.id,
      homeworkDueDate: homeworkDueDate || null,
    });
    if (res.success) {
      setSelectedSession({
        ...selectedSession,
        homeworkDueDate: homeworkDueDate || null,
      });
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, homeworkDueDate: homeworkDueDate || null }
            : s,
        ),
      );
      showToast("Đã cập nhật hạn nộp bài tập!", "success");
    } else {
      showToast(res.error || "Lỗi cập nhật hạn nộp.", "error");
    }
  };

  const handleStudentSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    if (!submissionUrl.trim()) {
      showToast("Vui lòng nhập link bài làm của bạn.", "warning");
      return;
    }

    const res = await submitHomework({
      scheduleId: selectedSession.id,
      fileUrl: submissionUrl.trim(),
      fileName: "Link bài làm Google Drive",
    });

    if (res.success) {
      setStudentSubmission(res.data);
      showToast("Đã nộp bài tập về nhà thành công!", "success");
    } else {
      showToast(res.error || "Gửi bài tập thất bại.", "error");
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;

    const res = await gradeHomework({
      submissionId: gradingSubmissionId,
      grade: parseFloat(gradingScore),
      feedback: gradingFeedback,
    });

    if (res.success) {
      showToast("Chấm điểm bài tập thành công!", "success");
      // Update local state list
      setActiveSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === gradingSubmissionId
            ? {
                ...sub,
                grade: parseFloat(gradingScore),
                feedback: gradingFeedback,
              }
            : sub,
        ),
      );
      setGradingSubmissionId("");
      setGradingScore("");
      setGradingFeedback("");
    } else {
      showToast(res.error || "Lỗi chấm điểm.", "error");
    }
  };

  // Find room & teacher conflicts in the full schedules list
  const activeConflicts = useMemo(() => findConflicts(schedules), [schedules]);

  // Group schedules for the detailed list view
  const { groups, singles } = useMemo(() => {
    const groupsMap = new Map<string, ScheduleItem[]>();
    const singlesList: ScheduleItem[] = [];

    for (const s of schedules) {
      const isOwn =
        userRole === "ADMIN" ||
        !isTeacherRole ||
        s.teacher.id === currentTeacherProfileId;

      if (!isOwn) {
        singlesList.push(s);
      } else if (!s.recurrenceGroupId) {
        singlesList.push(s);
      } else {
        const group = groupsMap.get(s.recurrenceGroupId) ?? [];
        group.push(s);
        groupsMap.set(s.recurrenceGroupId, group);
      }
    }
    return { groups: groupsMap, singles: singlesList };
  }, [schedules, userRole, isTeacherRole, currentTeacherProfileId]);

  return (
    <div className="flex flex-col gap-8">
      {/* Alert Notices */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3 text-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {userRole === "ADMIN" && activeConflicts.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeConflicts.map((msg, index) => (
            <div
              key={index}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs animate-fade-in shadow-sm"
            >
              <AlertTriangle className="h-4.5 w-4.5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800">
                  Phát hiện xung đột trùng lịch học
                </p>
                <p className="text-yellow-700 mt-0.5 leading-relaxed">
                  {msg}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HEADER CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-canvas border border-hairline rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={navigateToday}
            className="border border-divider hover:bg-surface-pearl text-ink text-xs font-semibold px-4 py-2 rounded-pill shadow-sm"
          >
            Hôm nay
          </button>
          <div className="flex items-center border border-divider rounded-pill overflow-hidden bg-canvas">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-surface-pearl text-ink-muted-80"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-surface-pearl text-ink-muted-80"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="font-tagline text-lg font-bold text-ink ml-2">
            {formatHeaderLabel()}
          </span>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex border border-divider rounded-pill overflow-hidden bg-surface-pearl p-0.5 self-start">
          <button
            onClick={() => setViewMode(isMobile ? "DAY" : "WEEK")}
            className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              viewMode === "WEEK"
                ? "bg-canvas text-primary shadow-sm"
                : "text-ink-muted-80 hover:text-ink"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setViewMode("MONTH")}
            className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              viewMode === "MONTH"
                ? "bg-canvas text-primary shadow-sm"
                : "text-ink-muted-80 hover:text-ink"
            }`}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* TIMETABLE GRID */}
      {viewMode === "DAY" ? (
        <div className="flex flex-col gap-4">
          <div className="bg-canvas border border-hairline rounded-lg p-4 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={navigatePrevious}
                  className="p-2 rounded-pill border border-divider hover:bg-surface-pearl text-ink-muted-80"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={navigateNext}
                  className="p-2 rounded-pill border border-divider hover:bg-surface-pearl text-ink-muted-80"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={navigateToday}
                  className="border border-divider hover:bg-surface-pearl text-ink text-xs font-semibold px-4 py-2 rounded-pill shadow-sm"
                >
                  Hôm nay
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dayViewDate}
                  onChange={(e) => {
                    setDayViewDate(e.target.value);
                    setCurrentDate(new Date(e.target.value));
                  }}
                  className="h-11 rounded-pill border border-divider bg-canvas px-3 text-sm text-ink outline-none focus:border-primary"
                />
                <span className="font-tagline text-lg font-bold text-ink">
                  {formatHeaderLabel()}
                </span>
              </div>
            </div>

            <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
              <div className="flex relative min-h-[640px]">
                <div className="w-16 flex-shrink-0 border-r border-divider-soft pr-2 pt-10 text-right text-[10px] font-mono text-ink-muted-48 flex flex-col justify-between h-[640px]">
                  {HOUR_LABELS.map((hl) => (
                    <div
                      key={hl}
                      className="h-[40px] leading-none flex items-start justify-end"
                    >
                      {hl}
                    </div>
                  ))}
                </div>

                <div className="flex-1 relative h-[640px]">
                  <div className="absolute inset-x-0 top-10 bottom-0 pointer-events-none flex flex-col justify-between z-0">
                    {HOUR_LABELS.slice(0, -1).map((_, idx) => (
                      <div
                        key={idx}
                        className="border-b border-divider-soft/40 h-[40px] w-full"
                      />
                    ))}
                  </div>

                  {processedSchedulesForDate(currentDayDate).map((e) => {
                    const isOwn =
                      userRole === "ADMIN" ||
                      !isTeacherRole ||
                      e.teacher.id === currentTeacherProfileId ||
                      e.class.id === classes[0]?.id;
                    const displayTitle = isOwn ? e.class.name : "Đã bận";
                    const displaySub = isOwn
                      ? `${e.subject.name} - ${e.room}`
                      : `Phòng ${e.room}`;
                    const displayTime = `${e.startTime} - ${e.endTime}`;

                    return (
                      <div
                        key={e.id}
                        style={{
                          top: `${e.top}px`,
                          height: `${e.height}px`,
                          left: `${e.left}%`,
                          width: `${e.width - 2}%`,
                        }}
                        onClick={() => {
                          if (isOwn) setSelectedSession(e);
                        }}
                        className={`absolute border rounded p-2 flex flex-col justify-between overflow-hidden text-[10px] transition-all group hover:z-20 shadow-sm cursor-pointer ${
                          isOwn
                            ? "bg-blue-50/95 hover:bg-blue-100 border-blue-200 text-blue-800"
                            : "bg-gray-100/90 border-gray-300 text-gray-600"
                        }`}
                        title={`${displayTitle} (${displayTime})`}
                      >
                        <div className="flex flex-col leading-tight">
                          <span className="font-bold truncate">
                            {displayTitle}
                          </span>
                          <span className="opacity-80 truncate mt-0.5">
                            {displaySub}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[8px] opacity-75 mt-1 font-mono">
                          <span>{e.startTime}</span>
                          {isOwn && userRole !== "STUDENT" && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteTrigger(e);
                              }}
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
            </div>
          </div>
        </div>
      ) : viewMode === "WEEK" ? (
        <div className="flex flex-col gap-4">
          <div className="bg-canvas border border-hairline rounded-lg p-4 shadow-sm overflow-x-auto min-w-[850px]">
            <div className="flex relative">
              {/* Hour labels axis on left */}
              <div className="w-14 flex-shrink-0 border-r border-divider-soft pr-2 pt-10 text-right text-[10px] font-mono text-ink-muted-48 flex flex-col justify-between h-[640px]">
                {HOUR_LABELS.map((hl) => (
                  <div
                    key={hl}
                    className="h-[40px] leading-none flex items-start justify-end"
                  >
                    {hl}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              <div className="flex-1 grid grid-cols-7 relative h-[640px]">
                {/* Background Grid Lines */}
                <div className="absolute inset-x-0 top-10 bottom-0 pointer-events-none flex flex-col justify-between z-0">
                  {HOUR_LABELS.slice(0, -1).map((_, idx) => (
                    <div
                      key={idx}
                      className="border-b border-divider-soft/40 h-[40px] w-full"
                    />
                  ))}
                </div>

                {DAYS_OF_WEEK.map((day) => {
                  const dayEvents = processedSchedulesByDay(day.value);
                  return (
                    <div
                      key={day.value}
                      className="border-r border-divider-soft last:border-0 relative h-[640px] bg-slate-50/10 z-10"
                    >
                      {/* Header title */}
                      <div className="absolute top-0 inset-x-0 h-9 border-b border-divider-soft flex flex-col items-center justify-center bg-surface-pearl">
                        <span className="text-[10px] font-bold text-ink">
                          {day.label}
                        </span>
                        <span className="text-[8px] text-ink-muted-48">
                          {dayEvents.length} ca học
                        </span>
                      </div>

                      {/* Content Area containing events */}
                      <div className="absolute top-10 bottom-0 inset-x-0">
                        {dayEvents.map((e) => {
                          const isOwn =
                            userRole === "ADMIN" ||
                            !isTeacherRole ||
                            e.teacher.id === currentTeacherProfileId ||
                            e.class.id === classes[0]?.id;
                          const displayTitle = isOwn ? e.class.name : "Đã bận";
                          const displaySub = isOwn
                            ? `${e.subject.name} - ${e.room}`
                            : `Phòng ${e.room}`;
                          const displayTime = `${e.startTime} - ${e.endTime}`;

                          return (
                            <div
                              key={e.id}
                              style={{
                                top: `${e.top}px`,
                                height: `${e.height}px`,
                                left: `${e.left}%`,
                                width: `${e.width - 2}%`,
                              }}
                              onClick={() => {
                                if (isOwn) setSelectedSession(e);
                              }}
                              className={`absolute border rounded p-1.5 flex flex-col justify-between overflow-hidden text-[9px] transition-all group hover:z-20 shadow-sm cursor-pointer ${
                                isOwn
                                  ? "bg-blue-50/95 hover:bg-blue-100 border-blue-200 text-blue-800"
                                  : "bg-gray-100/90 border-gray-300 text-gray-600"
                              }`}
                              title={`${displayTitle} (${displayTime})`}
                            >
                              <div className="flex flex-col leading-tight">
                                <span className="font-bold truncate">
                                  {displayTitle}
                                </span>
                                <span className="opacity-80 truncate mt-0.5">
                                  {displaySub}
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-[8px] opacity-75 mt-1 font-mono">
                                <span>{e.startTime}</span>
                                {isOwn && userRole !== "STUDENT" && (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDeleteTrigger(e);
                                    }}
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
      ) : (
        /* GOOGLE CALENDAR STYLE MONTH VIEW */
        <div className="bg-canvas border border-hairline rounded-lg p-4 shadow-sm overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Columns */}
            <div className="grid grid-cols-7 border-b border-hairline bg-surface-pearl text-center py-2 text-xs font-semibold text-ink">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d.value}>{d.label}</div>
              ))}
            </div>

            {/* Monthly Calendar Grid */}
            <div className="grid grid-cols-7 grid-rows-5 border-l border-t border-hairline bg-canvas">
              {monthDaysGrid.map((day, idx) => {
                const dayNum = day.getDate();
                const dayOfWeekValue = day.getDay() === 0 ? 7 : day.getDay();
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();

                // Find schedules for this specific date
                const daySchedules = schedules.filter((s) => {
                  if (s.dayOfWeek !== dayOfWeekValue) return false;
                  if (!s.date) return true;
                  const sDateStr = new Date(s.date).toISOString().split("T")[0];
                  const targetDateStr = day.toISOString().split("T")[0];
                  return sDateStr === targetDateStr;
                });

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] border-r border-b border-hairline p-2 flex flex-col gap-1 transition-all hover:bg-surface-pearl/30 ${
                      isCurrentMonth
                        ? "bg-canvas"
                        : "bg-slate-50 text-ink-muted-48 opacity-60"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold self-end px-1.5 py-0.5 rounded-full ${
                        day.toDateString() === new Date().toDateString()
                          ? "bg-primary text-white"
                          : "text-ink"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Compact schedule cards */}
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-16">
                      {daySchedules.map((s) => {
                        const isOwn =
                          userRole === "ADMIN" ||
                          !isTeacherRole ||
                          s.teacher.id === currentTeacherProfileId ||
                          s.class.id === classes[0]?.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (isOwn) setSelectedSession(s);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold truncate cursor-pointer ${
                              isOwn
                                ? "bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100"
                                : "bg-gray-100 border border-gray-200 text-gray-500"
                            }`}
                            title={`${isOwn ? `${s.class.name} • ${s.subject.name}` : "Đã bận"} (${s.startTime} - ${s.endTime})`}
                          >
                            {s.startTime} {isOwn ? s.class.name : "Đã bận"}
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
      )}

      {/* DETAILED SESSION MODAL (HOMEWORK, MATERIALS & SUBMISSIONS) */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[600px] max-w-full shadow-product flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <div>
                <h3 className="font-tagline text-base font-bold text-ink">
                  {isEditing
                    ? "Chỉnh sửa ca học"
                    : `Chi tiết buổi học: Lớp ${selectedSession.class.name}`}
                </h3>
                <p className="text-[10px] text-ink-muted-80 font-mono mt-0.5">
                  Chuyên đề: {selectedSession.subject.name} | Phòng:{" "}
                  {selectedSession.room || "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {userRole !== "STUDENT" && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-primary hover:text-primary-focus font-bold border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-pill shadow-sm"
                  >
                    Sửa ca học
                  </button>
                )}
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-ink-muted-80 hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              {isEditing ? (
                <form
                  onSubmit={handleUpdateTrigger}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5 text-xs">
                    <label className="font-caption-strong text-ink-muted-80">
                      Lớp học
                    </label>
                    <select
                      value={editClassId}
                      onChange={(e) => setEditClassId(e.target.value)}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                      required
                    >
                      <option value="">— Chọn lớp —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs">
                    <label className="font-caption-strong text-ink-muted-80">
                      Môn học
                    </label>
                    <select
                      value={editSubjectId}
                      onChange={(e) => setEditSubjectId(e.target.value)}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                      required
                    >
                      <option value="">— Chọn môn —</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {userRole === "ADMIN" && (
                    <div className="flex flex-col gap-1.5 text-xs">
                      <label className="font-caption-strong text-ink-muted-80">
                        Giáo viên giảng dạy
                      </label>
                      <select
                        value={editTeacherId}
                        onChange={(e) => setEditTeacherId(e.target.value)}
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                        required
                      >
                        <option value="">— Chọn giáo viên —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-caption-strong text-ink-muted-80">
                        Thứ trong tuần
                      </label>
                      <select
                        value={editDayOfWeek}
                        onChange={(e) =>
                          setEditDayOfWeek(parseInt(e.target.value))
                        }
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                        required
                      >
                        <option value={1}>Thứ Hai</option>
                        <option value={2}>Thứ Ba</option>
                        <option value={3}>Thứ Tư</option>
                        <option value={4}>Thứ Năm</option>
                        <option value={5}>Thứ Sáu</option>
                        <option value={6}>Thứ Bảy</option>
                        <option value={7}>Chủ Nhật</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-caption-strong text-ink-muted-80">
                        Ngày học
                      </label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-caption-strong text-ink-muted-80">
                        Giờ bắt đầu
                      </label>
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        placeholder="08:00"
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-caption-strong text-ink-muted-80">
                        Giờ kết thúc
                      </label>
                      <input
                        type="text"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        placeholder="09:30"
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs">
                    <label className="font-caption-strong text-ink-muted-80">
                      Phòng học (Room)
                    </label>
                    <select
                      value={editSelectedRoom}
                      onChange={(e) => setEditSelectedRoom(e.target.value)}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                      required
                    >
                      <option value="">— Chọn phòng học —</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-divider-soft pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2 rounded-pill font-semibold"
                    >
                      Hủy chỉnh sửa
                    </button>
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-focus text-white text-xs px-5 py-2 rounded-pill font-semibold shadow-sm"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Session Meta */}
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-ink-muted-80 font-semibold">
                        Thời gian:
                      </span>
                      <span className="font-bold text-blue-900">
                        {selectedSession.startTime} - {selectedSession.endTime}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-ink-muted-80 font-semibold">
                        Ngày học:
                      </span>
                      <span className="font-bold text-blue-900">
                        {selectedSession.date
                          ? new Date(selectedSession.date).toLocaleDateString(
                              "vi-VN",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : "Hàng tuần"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 border-t border-blue-200/50 pt-2">
                      <span className="text-ink-muted-80 font-semibold">
                        Giáo viên phụ trách:
                      </span>
                      <span className="font-bold text-blue-900">
                        {selectedSession.teacher.user.name}
                      </span>
                    </div>
                  </div>

                  {/* MATERIALS & HOMEWORK LINK INPUTS (TEACHER / ADMIN - Hướng A) */}
                  {userRole !== "STUDENT" ? (
                    <div className="flex flex-col gap-4 border-t border-divider-soft pt-4">
                      <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-tagline">
                        Đường dẫn Tài liệu học tập &amp; Bài tập
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2 p-3 bg-surface-pearl border border-hairline rounded-lg">
                          <span className="text-[10px] font-bold text-ink-muted-80">
                            1. Link tài liệu xem trước
                          </span>
                          <input
                            type="url"
                            value={materialsUrl}
                            onChange={(e) => setMaterialsUrl(e.target.value)}
                            placeholder="Dán link bài giảng, tài liệu..."
                            className="bg-canvas border border-divider-soft p-2 rounded text-xs outline-none focus:border-primary w-full"
                          />
                          <button
                            type="button"
                            onClick={handleSaveMaterials}
                            className="bg-primary hover:bg-primary-focus text-white text-[10px] font-bold py-1.5 px-3 rounded-pill mt-1 self-end"
                          >
                            Lưu Link tài liệu
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 p-3 bg-surface-pearl border border-hairline rounded-lg">
                          <span className="text-[10px] font-bold text-ink-muted-80">
                            2. Link đề bài tập về nhà (tự luận)
                          </span>
                          <input
                            type="url"
                            value={homeworkUrl}
                            onChange={(e) => setHomeworkUrl(e.target.value)}
                            placeholder="Dán link đề bài tập (PDF, Docx)..."
                            className="bg-canvas border border-divider-soft p-2 rounded text-xs outline-none focus:border-primary w-full"
                          />
                          <button
                            type="button"
                            onClick={handleSaveHomework}
                            className="bg-primary hover:bg-primary-focus text-white text-[10px] font-bold py-1.5 px-3 rounded-pill mt-1 self-end"
                          >
                            Lưu Link bài tập
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 p-3 bg-surface-pearl border border-hairline rounded-lg md:col-span-2">
                          <span className="text-[10px] font-bold text-ink-muted-80">
                            HOẶC Giao bài tập về nhà dạng Trắc nghiệm (Đề thi thử)
                          </span>
                          <div className="flex gap-2">
                            <select
                              value={homeworkQuizId}
                              onChange={(e) => setHomeworkQuizId(e.target.value)}
                              className="bg-canvas border border-divider-soft p-2 rounded text-xs outline-none focus:border-primary flex-1 h-9"
                            >
                              <option value="">-- Chọn bài kiểm tra / Đề thi mẫu --</option>
                              {quizzesList
                                .filter((q) => !q.classId || q.classId === selectedSession.class.id)
                                .map((q) => (
                                  <option key={q.id} value={q.id}>
                                    {q.title}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleSaveQuizHomework}
                              className="bg-primary hover:bg-primary-focus text-white text-[10px] font-bold py-1.5 px-4 rounded-pill self-center h-9"
                            >
                              Lưu bài trắc nghiệm
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 p-3 bg-surface-pearl border border-hairline rounded-lg">
                        <span className="text-[10px] font-bold text-ink-muted-80">
                          3. Hạn nộp bài tập về nhà
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="datetime-local"
                            value={homeworkDueDate}
                            onChange={(e) => setHomeworkDueDate(e.target.value)}
                            className="bg-canvas border border-divider-soft p-2 rounded text-xs outline-none focus:border-primary flex-1 h-9"
                          />
                          <button
                            type="button"
                            onClick={handleSaveDueDate}
                            className="bg-primary hover:bg-primary-focus text-white text-[10px] font-bold py-1.5 px-4 rounded-pill self-center h-9"
                          >
                            Lưu hạn nộp
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* STUDENT DOWNLOAD LINKS */
                    <div className="flex flex-col gap-4 border-t border-divider-soft pt-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                          Tài liệu học tập tự học
                        </h4>
                        {selectedSession.homeworkDueDate && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-mono font-bold">
                            Hạn nộp:{" "}
                            {new Date(
                              selectedSession.homeworkDueDate,
                            ).toLocaleString("vi-VN")}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-divider-soft rounded-lg p-4 bg-surface-pearl flex flex-col justify-between h-auto min-h-[112px] gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-ink-muted-80 block">
                              Tài liệu xem trước
                            </span>
                            <p className="text-[10px] text-ink-muted-48 mt-1 leading-snug">
                              Xem tài liệu để chuẩn bị kiến thức trước buổi học
                            </p>
                          </div>
                          {selectedSession.materials ? (
                            <a
                              href={selectedSession.materials}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-primary hover:bg-primary-focus text-white text-xs font-semibold px-3 py-1.5 rounded-pill shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <LinkIcon className="h-3.5 w-3.5" /> Xem bài giảng
                            </a>
                          ) : (
                            <span className="text-xs text-ink-muted-48 font-semibold italic text-center block pt-2">
                              Chưa cập nhật
                            </span>
                          )}
                        </div>

                        <div className="border border-divider-soft rounded-lg p-4 bg-surface-pearl flex flex-col justify-between h-auto min-h-[112px] gap-3">
                          {selectedSession.homeworkQuizId ? (
                            <>
                              <div>
                                <span className="text-[10px] font-bold text-ink-muted-80 block">
                                  Bài tập Trắc nghiệm (Online)
                                </span>
                                <p className="text-xs font-bold text-ink mt-1">
                                  {selectedSession.homeworkQuiz?.title || "Bài thi trắc nghiệm giao về nhà"}
                                </p>
                                {studentQuizResultScore !== null ? (
                                  <p className="text-[10px] text-green-700 font-bold mt-1.5 flex items-center gap-1">
                                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                    Đã hoàn thành: {studentQuizResultScore.toFixed(1)} / 10.0đ
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-amber-700 font-semibold mt-1">
                                    Chưa hoàn thành làm bài tập
                                  </p>
                                )}
                              </div>
                              <a
                                href={`/quizzes/${selectedSession.homeworkQuizId}`}
                                className={`text-white text-xs font-semibold px-3 py-1.5 rounded-pill shadow-sm flex items-center justify-center gap-1.5 ${
                                  studentQuizResultScore !== null
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-primary hover:bg-primary-focus animate-pulse"
                                }`}
                              >
                                <LinkIcon className="h-3.5 w-3.5" />
                                {studentQuizResultScore !== null ? "Xem kết quả & lời giải" : "Làm bài trắc nghiệm"}
                              </a>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-[10px] font-bold text-ink-muted-80 block">
                                  Bài tập về nhà
                                </span>
                                <p className="text-[10px] text-ink-muted-48 mt-1 leading-snug">
                                  Hoàn thành bài tập được giao và nộp lại đúng hạn
                                </p>
                              </div>
                              {selectedSession.homework ? (
                                <a
                                  href={selectedSession.homework}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-pill shadow-sm flex items-center justify-center gap-1.5"
                                >
                                  <LinkIcon className="h-3.5 w-3.5" /> Xem đề bài
                                  tập
                                </a>
                              ) : (
                                <span className="text-xs text-ink-muted-48 font-semibold italic text-center block pt-2">
                                  Chưa giao bài tập
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STUDENT SUBMISSION PORTAL (Hướng A - Google Drive URL) */}
                  {userRole === "STUDENT" && selectedSession.homework && (
                    <div className="border-t border-divider-soft pt-4 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                        Trạng thái nộp bài tập về nhà
                      </h4>

                      {studentSubmission ? (
                        <div className="bg-canvas border border-hairline rounded-lg p-4 flex flex-col gap-3 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-divider pb-2.5 gap-2">
                            <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />{" "}
                              Đã nộp bài tập
                            </span>
                            <div className="flex items-center gap-2">
                              {selectedSession.homeworkDueDate &&
                                (new Date(studentSubmission.submittedAt) >
                                new Date(selectedSession.homeworkDueDate) ? (
                                  <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                                    Nộp muộn
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
                                    Đúng hạn
                                  </span>
                                ))}
                              <span className="text-[10px] text-ink-muted-80 font-mono">
                                Nộp lúc:{" "}
                                {new Date(
                                  studentSubmission.submittedAt,
                                ).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs flex flex-col sm:flex-row sm:justify-between sm:items-center text-ink-muted-80 gap-1.5">
                            <span>Đường dẫn bài làm:</span>
                            <a
                              href={studentSubmission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-primary hover:underline truncate max-w-[280px]"
                            >
                              {studentSubmission.fileUrl}
                            </a>
                          </div>

                          {studentSubmission.grade !== null ? (
                            <div className="bg-green-50 border border-green-100 rounded p-3.5 text-xs flex flex-col gap-2 mt-2">
                              <div className="flex justify-between items-center font-bold text-green-800">
                                <span>Điểm chấm của giáo viên:</span>
                                <span className="text-sm bg-canvas border border-green-200 px-3 py-0.5 rounded-full">
                                  {studentSubmission.grade} / 10 đ
                                </span>
                              </div>
                              {studentSubmission.feedback && (
                                <p className="text-[11px] text-green-700 italic mt-1 block">
                                  Lời phê: {studentSubmission.feedback}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs p-3 rounded mt-2 italic">
                              Đang chờ giáo viên chấm điểm. Bạn vẫn có thể cập
                              nhật lại liên kết bài làm dưới đây.
                            </div>
                          )}

                          {studentSubmission.grade === null && (
                            <form
                              onSubmit={handleStudentSubmitUrl}
                              className="flex flex-col gap-2 mt-2 border-t border-divider-soft pt-2"
                            >
                              <span className="text-[10px] font-bold text-ink-muted-80">
                                Thay đổi đường dẫn bài nộp khác:
                              </span>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="url"
                                  value={submissionUrl}
                                  onChange={(e) =>
                                    setSubmissionUrl(e.target.value)
                                  }
                                  placeholder="Dán link Google Drive hoặc OneDrive bài làm mới..."
                                  className="bg-canvas border border-divider-soft p-2 rounded text-xs outline-none focus:border-primary flex-1"
                                  required
                                />
                                <button
                                  type="submit"
                                  className="bg-primary hover:bg-primary-focus text-white text-xs font-semibold px-4 py-1.5 rounded-pill"
                                >
                                  Lưu lại
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ) : (
                        <form
                          onSubmit={handleStudentSubmitUrl}
                          className="bg-red-50 border border-red-100 rounded-lg p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span className="text-xs font-bold text-red-950">
                              Chưa nộp bài tập về nhà!
                            </span>
                          </div>
                          <p className="text-[10px] text-red-700 leading-snug">
                            Hãy dán link bài làm của bạn (ví dụ: Google Drive
                            link chia sẻ chế độ &quot;Mọi người có liên kết đều
                            có thể xem&quot;) để nộp bài.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <input
                              type="url"
                              value={submissionUrl}
                              onChange={(e) => setSubmissionUrl(e.target.value)}
                              placeholder="Dán link Google Drive, OneDrive hoặc Dropbox..."
                              className="bg-canvas border border-divider-soft p-2.5 rounded text-xs outline-none focus:border-primary w-full"
                              required
                            />
                            <button
                              type="submit"
                              className="bg-primary hover:bg-primary-focus text-white text-xs font-semibold py-2 rounded-pill shadow-sm whitespace-nowrap px-4"
                            >
                              Xác nhận nộp bài tập
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* TEACHER SUBMISSIONS MANAGEMENT & GRADING (Hướng A & Quiz BTVN) */}
                  {userRole !== "STUDENT" && (
                    <div className="border-t border-divider-soft pt-4 flex flex-col gap-4">
                      {selectedSession.homeworkQuizId ? (
                        <>
                          <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-tagline">
                            Bảng điểm Bài tập trắc nghiệm trực tuyến (
                            {quizSubmissionsList.length} học viên)
                          </h4>
                          {loadingDetails ? (
                            <p className="text-xs text-ink-muted-48 italic">Đang tải điểm số trắc nghiệm...</p>
                          ) : quizSubmissionsList.length === 0 ? (
                            <div className="bg-slate-50 border border-divider-soft rounded-lg p-8 text-center text-ink-muted-80 text-xs italic">
                              Lớp học này chưa có học viên nào.
                            </div>
                          ) : (
                            <div className="border border-hairline rounded-lg overflow-x-auto bg-canvas">
                              <table className="w-full min-w-[500px] text-left text-xs font-body border-collapse">
                                <thead>
                                  <tr className="bg-surface-pearl text-ink-muted-80 border-b border-divider font-semibold text-[10px] uppercase tracking-wider">
                                    <th className="p-3">Học sinh</th>
                                    <th className="p-3 text-center">Trạng thái</th>
                                    <th className="p-3 text-center">Điểm số</th>
                                    <th className="p-3 text-right">Ngày làm bài</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-divider-soft">
                                  {quizSubmissionsList.map((st) => (
                                    <tr key={st.studentId} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-3 font-semibold text-ink">{st.studentName}</td>
                                      <td className="p-3 text-center">
                                        {st.submitted ? (
                                          <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">
                                            Đã hoàn thành
                                          </span>
                                        ) : (
                                          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold border border-red-200">
                                            Chưa làm bài
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 text-center">
                                        {st.submitted && st.score !== null ? (
                                          <span className="font-bold text-primary px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-xs">
                                            {Number(st.score).toFixed(1)} / 10.0đ
                                          </span>
                                        ) : (
                                          <span className="text-ink-muted-48">—</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-right text-ink-muted-48 text-[11px]">
                                        {st.submittedAt ? (
                                          new Date(st.submittedAt).toLocaleString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            day: "2-digit",
                                            month: "2-digit",
                                          })
                                        ) : (
                                          "Chưa có"
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                            Danh sách bài tập học viên nộp ({activeSubmissions.length})
                          </h4>

                          {loadingDetails ? (
                            <p className="text-xs text-ink-muted-48 italic">
                              Đang tải danh sách bài tập...
                            </p>
                          ) : activeSubmissions.length === 0 ? (
                            <div className="bg-slate-50 border border-divider-soft rounded-lg p-8 text-center text-ink-muted-80 text-xs italic">
                              Chưa có học sinh nào nộp bài tập cho ca học này.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                          {activeSubmissions.map((sub) => (
                            <div
                              key={sub.id}
                              className="border border-hairline rounded-lg p-4 bg-canvas flex flex-col gap-3 shadow-sm"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs border-b border-divider-soft pb-2 gap-2">
                                <span className="font-bold text-ink flex items-center gap-2">
                                  {sub.student.user.name}
                                  {selectedSession.homeworkDueDate &&
                                    (new Date(sub.submittedAt) >
                                    new Date(
                                      selectedSession.homeworkDueDate,
                                    ) ? (
                                      <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                        Nộp muộn
                                      </span>
                                    ) : (
                                      <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                                        Đúng hạn
                                      </span>
                                    ))}
                                </span>
                                <span className="text-[10px] text-ink-muted-80 font-mono">
                                  Nộp lúc:{" "}
                                  {new Date(sub.submittedAt).toLocaleString(
                                    "vi-VN",
                                  )}
                                </span>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-ink-muted-80 gap-1.5">
                                <span>Link bài làm của học sinh:</span>
                                <a
                                  href={sub.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary font-bold hover:underline flex items-center gap-1 truncate max-w-[300px]"
                                >
                                  <FileText className="h-3.5 w-3.5 flex-shrink-0" />{" "}
                                  Mở liên kết bài làm
                                </a>
                              </div>

                              {/* Grade representation / editing */}
                              {gradingSubmissionId === sub.id ? (
                                <form
                                  onSubmit={handleGradeSubmit}
                                  className="bg-surface-pearl border border-divider rounded-lg p-3 flex flex-col gap-3 mt-1.5"
                                >
                                  <span className="text-[10px] font-bold text-ink-muted-80">
                                    Chấm điểm trực tiếp
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1 sm:col-span-1">
                                      <label className="text-[9px] font-semibold text-ink-muted-80">
                                        Điểm số
                                      </label>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="10"
                                        value={gradingScore}
                                        onChange={(e) =>
                                          setGradingScore(e.target.value)
                                        }
                                        placeholder="8.5"
                                        className="bg-canvas border border-hairline rounded px-3 py-1.5 text-xs text-center outline-none"
                                        required
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1 sm:col-span-2">
                                      <label className="text-[9px] font-semibold text-ink-muted-80">
                                        Lời phê / Nhận xét
                                      </label>
                                      <input
                                        type="text"
                                        value={gradingFeedback}
                                        onChange={(e) =>
                                          setGradingFeedback(e.target.value)
                                        }
                                        placeholder="Làm bài tốt, cần cẩn thận phần lượng giác..."
                                        className="bg-canvas border border-hairline rounded px-3 py-1.5 text-xs outline-none"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row justify-end gap-2 mt-1 w-full sm:w-auto">
                                    <button
                                      type="button"
                                      onClick={() => setGradingSubmissionId("")}
                                      className="border border-divider text-xs px-3 py-1.5 rounded-pill text-ink w-full sm:w-auto"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      type="submit"
                                      className="bg-primary text-white text-xs px-4 py-1.5 rounded-pill font-semibold shadow-sm w-full sm:w-auto"
                                    >
                                      Lưu kết quả
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface-pearl/50 border border-hairline rounded p-2.5 mt-1 gap-2">
                                  <div>
                                    {sub.grade !== null ? (
                                      <div className="text-xs">
                                        <span className="font-bold text-green-700">
                                          Điểm chấm: {sub.grade} / 10 đ
                                        </span>
                                        {sub.feedback && (
                                          <p className="text-[10px] text-ink-muted-80 italic mt-0.5">
                                            Lời phê: {sub.feedback}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />{" "}
                                        Chưa chấm điểm
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setGradingSubmissionId(sub.id);
                                      setGradingScore(
                                        sub.grade !== null
                                          ? sub.grade.toString()
                                          : "",
                                      );
                                      setGradingFeedback(sub.feedback || "");
                                    }}
                                    className="text-xs text-primary hover:underline font-bold flex items-center gap-1 self-start sm:self-auto"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />{" "}
                                    {sub.grade !== null
                                      ? "Sửa điểm"
                                      : "Chấm bài"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>)}
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* RECURRING DELETE CHOICES POPUP */}
      {showDeleteConfirm && sessionToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[450px] shadow-product p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-tagline text-base font-bold text-ink">
                  Xóa ca học lặp lại
                </h3>
                <p className="text-xs text-ink-muted-80 mt-2 leading-relaxed">
                  Lịch học này được thiết lập lặp lại hàng tuần. Bạn muốn thực
                  hiện xóa ca học như thế nào?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() =>
                  handleDeleteExecute(sessionToDelete.id, "ONLY_THIS")
                }
                className="w-full bg-slate-100 hover:bg-slate-200 border border-divider text-ink text-xs font-semibold py-2.5 rounded-pill"
              >
                Chỉ xóa duy nhất ca học này
              </button>
              <button
                onClick={() =>
                  handleDeleteExecute(sessionToDelete.id, "ALL_FUTURE")
                }
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2.5 rounded-pill shadow-sm"
              >
                Xóa ca học này và tất cả các ca lặp lại trong tương lai
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSessionToDelete(null);
                }}
                className="w-full border border-divider hover:bg-surface-pearl text-ink-muted-80 text-xs font-semibold py-2.5 rounded-pill"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECURRING UPDATE CHOICES POPUP */}
      {showUpdateConfirm && selectedSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[450px] shadow-product p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-tagline text-base font-bold text-ink">
                  Cập nhật lịch học lặp lại
                </h3>
                <p className="text-xs text-ink-muted-80 mt-2 leading-relaxed">
                  Lịch học này được thiết lập lặp lại hàng tuần. Bạn muốn thực
                  hiện cập nhật chuỗi lịch học như thế nào?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  if (confirm("Xác nhận cập nhật duy nhất ca học này?")) {
                    handleUpdateExecute("ONLY_THIS");
                  }
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-divider text-ink text-xs font-semibold py-2.5 rounded-pill"
              >
                Chỉ áp dụng cập nhật cho ca học này
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Xác nhận cập nhật ca học này và tất cả các ca học tiếp theo?",
                    )
                  ) {
                    handleUpdateExecute("ALL_FUTURE");
                  }
                }}
                className="w-full bg-primary hover:bg-primary-focus text-white text-xs font-semibold py-2.5 rounded-pill shadow-sm"
              >
                Áp dụng cho ca học này và tất cả các ca học tiếp theo
              </button>
              <button
                onClick={() => {
                  setShowUpdateConfirm(false);
                }}
                className="w-full border border-divider hover:bg-surface-pearl text-ink-muted-80 text-xs font-semibold py-2.5 rounded-pill"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAP WARNING DIALOG */}
      {warningMsg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[450px] shadow-product p-6 flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-tagline text-base font-bold text-ink">
                  Phát hiện trùng lịch học!
                </h3>
                <p className="text-xs text-ink-muted-80 mt-2 leading-relaxed">
                  {warningMsg}
                </p>
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
          <h2 className="font-tagline text-lg font-semibold text-ink">
            Danh sách ca học chi tiết
          </h2>
          <p className="font-caption text-ink-muted-80">
            Bảng danh mục chi tiết tất cả các ca học đã được sắp xếp trong hệ
            thống
          </p>

          <div className="bg-canvas border border-hairline rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full min-w-[750px] text-xs text-left">
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
                {Array.from(groups.entries()).map(([groupId, rows]) => {
                  const first = rows[0];
                  const sorted = [...rows].sort(
                    (a, b) =>
                      (a.date ? new Date(a.date as any).getTime() : 0) -
                      (b.date ? new Date(b.date as any).getTime() : 0)
                  );
                  const earliest = sorted[0].date
                    ? new Date(sorted[0].date as any).toLocaleDateString("vi-VN")
                    : "—";
                  const latest = sorted[sorted.length - 1].date
                    ? new Date(sorted[sorted.length - 1].date as any).toLocaleDateString("vi-VN")
                    : "—";
                  const isExpanded = expandedGroups.has(groupId);

                  return (
                    <React.Fragment key={groupId}>
                      {/* Summary row */}
                      <tr
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => toggleGroup(groupId)}
                      >
                        <td className="p-3 font-semibold flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px] select-none">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                          <span>{first.class.name}</span>
                        </td>
                        <td className="p-3 font-semibold text-primary">
                          {first.subject.name}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-700">
                            {DOW_LABELS[first.dayOfWeek] || `Thứ ${first.dayOfWeek + 1}`}
                          </span>{" "}
                          ({first.startTime} - {first.endTime})
                          <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                            {earliest} &rarr; {latest} · {rows.length} ca
                          </span>
                        </td>
                        <td className="p-3">{first.teacher.user.name}</td>
                        <td className="p-3">{first.room || "—"}</td>
                        <td className="p-3 text-center">
                          {userRole !== "STUDENT" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(groupId, first.id);
                              }}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Detail sub-rows */}
                      {isExpanded &&
                        sorted.map((s) => (
                          <tr key={s.id} className="bg-slate-50/50 text-slate-600 border-l-2 border-primary/20">
                            <td className="p-2.5 pl-8 text-slate-400 font-medium">↳ Ca học</td>
                            <td className="p-2.5">—</td>
                            <td className="p-2.5 font-medium">
                              {s.date
                                ? new Date(s.date).toLocaleDateString("vi-VN")
                                : "—"}{" "}
                              ({s.startTime} - {s.endTime})
                            </td>
                            <td className="p-2.5">—</td>
                            <td className="p-2.5">{s.room || "—"}</td>
                            <td className="p-2.5 text-center">
                              {userRole !== "STUDENT" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTrigger(s);
                                  }}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-55 p-1 rounded-full"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}

                {/* Single rows */}
                {singles.map((s) => {
                  const isOwn =
                    userRole === "ADMIN" ||
                    !isTeacherRole ||
                    s.teacher.id === currentTeacherProfileId;
                  return (
                    <tr key={s.id} className="hover:bg-surface-pearl/50">
                      <td className="p-3 font-semibold">
                        {isOwn ? s.class.name : "Đã bận"}
                      </td>
                      <td className="p-3 font-semibold text-primary">
                        {isOwn ? s.subject.name : "—"}
                      </td>
                      <td className="p-3">
                        {s.date
                          ? new Date(s.date as any).toLocaleDateString("vi-VN")
                          : `Thứ ${s.dayOfWeek + 1}`}{" "}
                        ({s.startTime} - {s.endTime})
                      </td>
                      <td className="p-3">
                        {isOwn ? s.teacher.user.name : "Giảng viên khác"}
                      </td>
                      <td className="p-3">{isOwn ? s.room || "—" : "—"}</td>
                      <td className="p-3 text-center">
                        {isOwn && userRole !== "STUDENT" && (
                          <button
                            onClick={() => handleDeleteTrigger(s)}
                            className="text-red-500 hover:bg-red-55 p-1.5 rounded-full"
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

        {/* Right Form (Hidden for students) */}
        {userRole !== "STUDENT" ? (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-tagline text-lg font-semibold text-ink">
                Thêm lịch học
              </h2>
              <p className="font-caption text-ink-muted-80 mt-1">
                Thiết lập thời gian biểu cho lớp
              </p>
            </div>

            <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
              <form
                onSubmit={(e) => handleFormSubmit(e)}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">
                    Lớp học
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => {
                      setClassId(e.target.value);
                      setFormErrors((prev) => ({ ...prev, classId: "" }));
                    }}
                    className={`bg-canvas border rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full ${
                      formErrors.classId ? "border-red-500" : "border-hairline"
                    }`}
                  >
                    <option value="">— Chọn lớp —</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.classId && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.classId}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">
                    Môn học
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setFormErrors((prev) => ({ ...prev, subjectId: "" }));
                    }}
                    className={`bg-canvas border rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full ${
                      formErrors.subjectId ? "border-red-500" : "border-hairline"
                    }`}
                  >
                    <option value="">— Chọn môn —</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                  {formErrors.subjectId && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.subjectId}</p>
                  )}
                </div>

                {!isTeacherRole && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">
                      Giáo viên giảng dạy
                    </label>
                    <select
                      value={teacherId}
                      onChange={(e) => {
                        setTeacherId(e.target.value);
                        setFormErrors((prev) => ({ ...prev, teacherId: "" }));
                      }}
                      className={`bg-canvas border rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full ${
                        formErrors.teacherId ? "border-red-500" : "border-hairline"
                      }`}
                    >
                      <option value="">— Chọn giáo viên —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.teacherId && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.teacherId}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">
                    Thứ trong tuần
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => handleDayOfWeekChange(parseInt(e.target.value))}
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
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

                {/* Specific Dates ranges for Google calendar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className={`bg-canvas border rounded-pill px-4 py-2 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full ${
                      formErrors.startDate ? "border-red-500" : "border-hairline"
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.startDate}</p>
                  )}
                  {dowMismatch && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      Ngày {startDate} không phải Thứ {dayOfWeek === 7 ? "Nhật" : dayOfWeek + 1}.
                      <button
                        type="button"
                        className="underline text-blue-500 font-semibold"
                        onClick={() => {
                          setStartDate(nearestDateForDow(dayOfWeek));
                          setDowMismatch(false);
                        }}
                      >
                        Tự động sửa
                      </button>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">
                    Cơ chế lặp
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => {
                      setRecurrence(e.target.value as any);
                      setFormErrors((prev) => ({ ...prev, endDate: "" }));
                    }}
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  >
                    <option value="NONE">
                      Không lặp lại (Chỉ ngày đã chọn)
                    </option>
                    <option value="WEEKLY">Lặp lại hàng tuần</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={recurrence === "NONE" ? startDate : endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setFormErrors((prev) => ({ ...prev, endDate: "" }));
                    }}
                    disabled={recurrence === "NONE"}
                    className={`bg-canvas border rounded-pill px-4 py-2 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full ${
                      recurrence === "NONE"
                        ? "opacity-60 bg-slate-50 cursor-not-allowed border-hairline"
                        : formErrors.endDate
                        ? "border-red-500"
                        : "border-hairline"
                    }`}
                  />
                  {recurrence === "WEEKLY" && formErrors.endDate && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.endDate}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">
                      Giờ bắt đầu
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        setFormErrors((prev) => ({ ...prev, startTime: "" }));
                        const newEnd = addMinutes(e.target.value, 90);
                        if (!endTime || endTime <= e.target.value) {
                          setEndTime(newEnd);
                          setFormErrors((prev) => ({ ...prev, endTime: "" }));
                        }
                      }}
                      className={`bg-canvas border rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center ${
                        formErrors.startTime ? "border-red-500" : "border-hairline"
                      }`}
                    >
                      <option value="">— Chọn giờ —</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {formErrors.startTime && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.startTime}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">
                      Giờ kết thúc
                    </label>
                    <select
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setFormErrors((prev) => ({ ...prev, endTime: "" }));
                      }}
                      className={`bg-canvas border rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center ${
                        formErrors.endTime ? "border-red-500" : "border-hairline"
                      }`}
                    >
                      <option value="">— Chọn giờ —</option>
                      {TIME_SLOTS.filter((t) => t > startTime).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {formErrors.endTime && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">
                    Phòng học (Room)
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setFormErrors((prev) => ({ ...prev, room: "" }));
                    }}
                    className={`bg-canvas border rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full ${
                      formErrors.room ? "border-red-500" : "border-hairline"
                    }`}
                  >
                    <option value="">— Chọn phòng học —</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} (Sức chứa: {r.capacity || "KGH"})
                      </option>
                    ))}
                  </select>
                  {formErrors.room && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.room}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={dowMismatch}
                  className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  Tạo lịch học
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
