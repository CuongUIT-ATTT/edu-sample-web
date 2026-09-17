"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  Play,
  AlertCircle,
  Lock,
  ArrowLeft,
  BookOpen,
  Trophy,
  ShieldCheck,
  Zap,
  HelpCircle,
} from "lucide-react";
import { getQuizAnswerReview, submitQuiz, startQuizAttempt } from "@/actions/quizzes";
import { cleanQuestionText } from "@/lib/quiz-shuffle";
import MathRenderer from "@/components/MathRenderer";
import Link from "next/link";
import { showToast } from "@/components/Toast";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

interface Question {
  id: string;
  questionText: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  score: number;
  explanation?: string | null;
  imageUrl?: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  passingScore: number;
  deadline?: string | null;
  startsAt?: string | null;
  subjectName: string;
  isPublic: boolean | undefined;
  questions: Question[];
}

interface SingleQuizPlayerProps {
  quiz: Quiz;
  sessionUser: { name: string; role: string } | null;
  skipRules?: boolean;
  classId?: string | null;
  className?: string | null;
}

export default function SingleQuizPlayer({
  quiz,
  sessionUser,
  skipRules = false,
  classId,
  className,
}: SingleQuizPlayerProps) {
  const [guestName, setGuestName] = useState(sessionUser?.name || "");
  const [quizStarted, setQuizStarted] = useState(false);
  const [showRules, setShowRules] = useState(skipRules);
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    passed: boolean;
    submissionId: string;
    isLate?: boolean;
    correctAnswers?: { id: string; correctAnswer: string; explanation: string | null }[] | null;
    answerReview?: { available: boolean; policy: string; message: string; availableAt: string | null };
  } | null>(null);

  // Anti-screenshot protection
  useEffect(() => {
    if (!quizStarted || quizResult) return;

    const preventScreenshot = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        showToast("Không được phép chụp ảnh màn hình trong khi làm bài!", "warning");
      }
      if ((e.ctrlKey || e.metaKey) && ["p", "c", "u", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (e.key.toLowerCase() === "p") {
          showToast("Không được phép chụp ảnh màn hình trong khi làm bài!", "warning");
        }
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", preventScreenshot);
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("keydown", preventScreenshot);
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [quizStarted, quizResult]);

  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [isCheatedLocked, setIsCheatedLocked] = useState(false);
  const [paper, setPaper] = useState<Question[] | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examCode, setExamCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const forceSubmitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    forceSubmitRef.current = handleSubmit;
  }, [answers, guestName, timeLeft]);

  useEffect(() => {
    if (!quizStarted || quizResult) return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [quizStarted, quizResult]);

  // Anti-cheating logic
  useEffect(() => {
    if (!quizStarted || quizResult || isCheatedLocked) return;

    let lastWarningTime = 0;

    const triggerWarning = () => {
      const now = Date.now();
      if (now - lastWarningTime < 2000) return;
      lastWarningTime = now;

      setCheatWarnings((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setIsCheatedLocked(true);
          showToast("BÀI THI BỊ KHÓA: Bạn đã rời màn hình/chuyển tab quá 3 lần. Bài thi sẽ tự động được nộp.", "error");
          if (forceSubmitRef.current) {
            forceSubmitRef.current();
          }
          return next;
        } else {
          showToast(`CẢNH BÁO GIAN LẬN: Bạn không được rời màn hình làm bài! Lần vi phạm: ${next}/3.`, "warning");
          return next;
        }
      });
    };

    const handleVisibility = () => {
      if (document.hidden) triggerWarning();
    };

    const handleBlur = () => {
      triggerWarning();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [quizStarted, quizResult, isCheatedLocked]);

  // Timer
  useEffect(() => {
    if (!quizStarted || timeLeft <= 0 || quizResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizResult]);

  useEffect(() => {
    if (quizStarted && timeLeft === 0 && !quizResult) {
      handleSubmit();
    }
  }, [timeLeft]);

  const [agreed, setAgreed] = useState(false);
  const guestNameInputRef = useRef<HTMLInputElement | null>(null);

  const readGuestName = (): string => {
    const refGuestName = guestNameInputRef.current?.value?.trim();
    if (refGuestName) return refGuestName;
    const domGuestName = document
      .querySelectorAll<HTMLInputElement>('input[placeholder="Ví dụ: Nguyễn Văn A..."]')
      .item(0)
      ?.value?.trim();
    if (domGuestName) return domGuestName;
    const stateGuestName = guestName.trim();
    if (stateGuestName) return stateGuestName;
    return sessionUser?.name?.trim() || "";
  };

  const beginQuiz = async (overrideGuestName?: string) => {
    const resolvedGuestName = overrideGuestName ?? (sessionUser ? sessionUser.name : readGuestName());
    if (starting) return;
    setStarting(true);
    try {
      const res = await startQuizAttempt({
        quizId: quiz.id,
        guestName: resolvedGuestName,
        classId: classId || undefined,
      });
      if (res.success && res.data) {
        setPaper(
          res.data.questions.map((q) => ({
            id: q.id,
            questionText: cleanQuestionText(q.text),
            type: q.type,
            options: q.options,
            score: q.score,
            imageUrl: q.imageUrl,
          }))
        );
        setAttemptId(res.data.attemptId);
        setExamCode(res.data.examCode);
        setTimeLeft(quiz.duration * 60);
        setAnswers({});
        setQuizResult(null);
        setShowReview(false);
        setQuizStarted(true);
        setShowRules(false);
      } else {
        showToast(res.error || "Không thể bắt đầu làm bài.", "error");
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      showToast("Lỗi hệ thống khi bắt đầu làm bài.", "error");
    } finally {
      setStarting(false);
    }
  };

  const handleStartQuiz = () => {
    const currentGuestName = readGuestName();
    if (!currentGuestName) {
      showToast("Vui lòng nhập Họ tên để bắt đầu làm bài thi thử.", "warning");
      return;
    }
    if (!agreed) {
      showToast("Vui lòng đồng ý với Nội quy phòng thi để tiếp tục.", "warning");
      return;
    }
    setGuestName(currentGuestName);
    if (quiz.startsAt && Date.now() < new Date(quiz.startsAt).getTime()) {
      showToast("Đề thi chưa mở cho lớp của bạn.", "warning");
      return;
    }
    if (quiz.deadline && Date.now() > new Date(quiz.deadline).getTime()) {
      showToast("Đề đã quá hạn — bài làm của bạn sẽ được đánh dấu Nộp muộn.", "warning");
    }
    beginQuiz(currentGuestName);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex.toString(),
    }));
  };

  const handleSelectTrueFalse = (questionId: string, statementIdx: number, val: "T" | "F") => {
    const current = answers[questionId] || "-,-,-,-";
    const parts = current.split(",");
    parts[statementIdx] = val;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: parts.join(","),
    }));
  };

  const handleShortAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  async function handleSubmit() {
    if (submitting || quizResult) return;
    setSubmitting(true);

    try {
      const response = await submitQuiz({
        quizId: quiz.id,
        answers,
        guestName: sessionUser ? sessionUser.name : guestName,
        timeExpired: timeLeft === 0,
        attemptId: attemptId || undefined,
        classId: classId || undefined,
      });

      if (response.success && response.data) {
        setQuizResult({
          score: response.data.score,
          maxScore: response.data.maxScore,
          passed: response.data.passed,
          submissionId: response.data.submissionId,
          isLate: response.data.isLate,
          correctAnswers: response.data.correctAnswers,
          answerReview: response.data.answerReview,
        });
      } else {
        showToast(response.error || "Có lỗi xảy ra khi nộp bài.", "error");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const handleCheckAnswerReview = async () => {
    if (!quizResult?.submissionId) return;

    try {
      const response = await getQuizAnswerReview(quizResult.submissionId, attemptId || undefined);
      if (!response.success || !response.data) {
        showToast(response.error || "Không thể tải đáp án.", "error");
        return;
      }

      setQuizResult((prev) => prev
        ? {
            ...prev,
            correctAnswers: response.data.correctAnswers,
            answerReview: response.data.answerReview,
          }
        : prev);

      if (response.data.correctAnswers) {
        setShowReview(true);
      } else {
        showToast(response.data.answerReview.message, "info");
      }
    } catch (error) {
      console.error("Error checking answer review:", error);
      showToast("Lỗi hệ thống khi kiểm tra đáp án.", "error");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-screen bg-canvas text-ink px-3 py-6 sm:px-6 sm:py-10 overflow-hidden transition-colors duration-300">
      {/* Radiant Background Blur */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,102,204,0.12),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]" />

      <div className="max-w-[860px] mx-auto flex flex-col gap-8 relative z-10">
        {/* 1. INTRO & RULES CARD */}
        {!quizStarted && !quizResult && (
          <div className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col gap-3 border-b border-hairline pb-5">
              <div className="flex justify-between items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  {quiz.subjectName}
                </span>
                {className && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                    Lớp: {className}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-snug">{quiz.title}</h1>

              <p className="text-xs sm:text-sm text-ink-muted-80 font-body leading-relaxed">
                {quiz.description || "Đề ôn thi thử chất lượng cao bám sát cấu trúc mới kèm lời giải chi tiết."}
              </p>
            </div>

            {/* Exam Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
              <div className="bg-canvas/60 dark:bg-slate-800/60 p-3 rounded-2xl border border-hairline flex flex-col items-center justify-center gap-1 text-center">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-ink font-bold">{quiz.duration} phút</span>
                <span className="text-[10px] text-ink-muted-48">Thời gian</span>
              </div>
              <div className="bg-canvas/60 dark:bg-slate-800/60 p-3 rounded-2xl border border-hairline flex flex-col items-center justify-center gap-1 text-center">
                <HelpCircle className="h-4 w-4 text-purple-500" />
                <span className="text-ink font-bold">{quiz.questions.length} câu</span>
                <span className="text-[10px] text-ink-muted-48">Số câu hỏi</span>
              </div>
              <div className="bg-canvas/60 dark:bg-slate-800/60 p-3 rounded-2xl border border-hairline flex flex-col items-center justify-center gap-1 text-center">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span className="text-ink font-bold">{quiz.passingScore.toFixed(1)}đ</span>
                <span className="text-[10px] text-ink-muted-48">Điểm đạt</span>
              </div>
              <div className="bg-canvas/60 dark:bg-slate-800/60 p-3 rounded-2xl border border-hairline flex flex-col items-center justify-center gap-1 text-center">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                <span className="text-ink font-bold">{quiz.isPublic ? "Công khai" : "Nội bộ"}</span>
                <span className="text-[10px] text-ink-muted-48">Hình thức</span>
              </div>
            </div>

            {/* Rules Block */}
            <div className="bg-canvas/60 dark:bg-slate-800/60 p-5 rounded-2xl border border-hairline flex flex-col gap-3 text-xs sm:text-sm text-ink-muted-80 font-body">
              <h3 className="font-bold text-ink flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" /> Quy Chế Phòng Thi & Chống Gian Lận
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Thời gian đếm ngược ngay khi bấm bắt đầu. Khi hết giờ hệ thống sẽ tự nộp bài.</li>
                <li>Cấm rời khỏi màn hình hoặc chuyển tab (vi phạm quá 3 lần sẽ tự động khóa bài thi).</li>
                <li>Màn hình hiển thị mã Watermark chống sao chép và chụp ảnh trái phép.</li>
              </ul>
            </div>

            {/* Guest Name Entry if applicable */}
            {!sessionUser || !sessionUser.name?.trim() ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-ink">Họ và Tên Thí Sinh *</label>
                <input
                  ref={guestNameInputRef}
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-hairline rounded-full px-5 py-3 text-xs sm:text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            ) : null}

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none bg-primary/5 p-3.5 rounded-2xl border border-primary/15">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary rounded"
              />
              <span className="text-xs font-semibold text-ink leading-snug">
                Tôi cam kết làm bài tự lực, trung thực và tuân thủ mọi quy chế phòng thi EduWeb.
              </span>
            </label>

            {/* Action Button */}
            <button
              onClick={handleStartQuiz}
              disabled={!agreed || (!sessionUser && !guestName.trim())}
              className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-focus hover:to-blue-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed apple-active-scale transition-all"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Vào thi ngay (Tính giờ)</span>
            </button>
          </div>
        )}

        {/* 2. PLAYING EXAM VIEW */}
        {quizStarted && !quizResult && (
          <div
            className="flex flex-col gap-5 sm:gap-6 max-w-[860px] mx-auto w-full select-none relative animate-fade-in"
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Watermark */}
            <div className="pointer-events-none fixed inset-0 z-20 flex flex-wrap gap-16 justify-center items-center overflow-hidden opacity-[0.025] select-none">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="text-ink font-bold text-xs transform -rotate-12 whitespace-nowrap">
                  {guestName || "Thí sinh"} - Đang thi thử - CẤM SAO CHÉP / QUAY MÀN HÌNH
                </div>
              ))}
            </div>

            {/* Sticky Timer Bar */}
            <div className="sticky top-3 sm:top-6 z-30 backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border border-white/60 dark:border-white/15 rounded-2xl p-3 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex flex-col gap-1 min-w-0 w-full sm:w-auto">
                <h2 className="font-body-strong text-sm sm:text-base text-ink font-extrabold truncate">{quiz.title}</h2>
                <div className="flex items-center gap-2 text-xs text-ink-muted-80 flex-wrap">
                  <span className="font-semibold text-primary">Thí sinh: {guestName}</span>
                  {examCode && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-primary border border-blue-500/20 font-bold text-[11px]">
                      Mã đề: {examCode.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2.5 text-red-600 dark:text-red-400 font-mono font-bold text-base sm:text-lg bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full shadow-inner flex-shrink-0 w-full sm:w-auto">
                <Clock className="h-5 w-5 animate-pulse text-red-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Questions Stack */}
            <div className="flex flex-col gap-5 sm:gap-8 relative mt-1 sm:mt-2">
              {isCheatedLocked && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 rounded-3xl text-white text-center min-h-[360px] shadow-2xl">
                  <Lock className="h-16 w-16 text-red-400 mb-4 animate-bounce" />
                  <h3 className="font-tagline text-xl font-bold text-white">Bài Thi Đã Bị Khóa Tự Động</h3>
                  <p className="text-sm text-slate-300 max-w-md mt-2 leading-relaxed">
                    Hệ thống ghi nhận bạn đã rời màn hình làm bài quá 3 lần. Bài thi đã bị tự động nộp.
                  </p>
                </div>
              )}

              {(paper || []).map((q, idx) => (
                <div
                  key={q.id}
                  className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col gap-4 shadow-lg text-left"
                >
                  <h3 className="font-body-strong text-sm sm:text-base text-ink font-bold leading-relaxed">
                    Câu {idx + 1}: <MathRenderer text={q.questionText} />
                  </h3>

                  {q.imageUrl && q.imageUrl.trim() && (
                    <div className="my-2 border border-hairline rounded-2xl overflow-hidden max-w-full bg-canvas shadow-sm">
                      <img src={q.imageUrl} alt={`Minh họa câu ${idx + 1}`} className="w-full h-auto object-contain max-h-96" />
                    </div>
                  )}

                  {q.type === "TRUE_FALSE" ? (
                    <div className="flex flex-col gap-3 border border-hairline rounded-2xl p-4 bg-canvas/60 dark:bg-slate-800/60">
                      <div className="grid grid-cols-12 text-xs font-bold text-ink-muted-48 uppercase border-b border-hairline pb-2 mb-1">
                        <div className="col-span-8 sm:col-span-9">Ý phát biểu</div>
                        <div className="col-span-2 sm:col-span-1.5 text-center">Đúng</div>
                        <div className="col-span-2 sm:col-span-1.5 text-center">Sai</div>
                      </div>
                      {(q.options || []).map((opt, optIndex) => {
                        const currentAnswers = (answers[q.id] || "-,-,-,-").split(",");
                        const val = currentAnswers[optIndex] || "-";
                        return (
                          <div key={optIndex} className="grid grid-cols-12 items-center gap-2 py-2 border-b border-hairline/60 last:border-0 text-xs sm:text-sm">
                            <div className="col-span-8 sm:col-span-9 flex gap-2 font-medium">
                              <span className="font-bold text-primary">{String.fromCharCode(97 + optIndex)})</span>
                              <MathRenderer text={opt} />
                            </div>
                            <div className="col-span-2 sm:col-span-1.5 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleSelectTrueFalse(q.id, optIndex, "T")}
                                className={`w-8 h-8 rounded-full text-xs font-bold border transition-all ${
                                  val === "T" ? "bg-emerald-600 border-emerald-600 text-white shadow-md scale-105" : "border-hairline hover:bg-emerald-500/10 text-emerald-600"
                                }`}
                              >
                                Đ
                              </button>
                            </div>
                            <div className="col-span-2 sm:col-span-1.5 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleSelectTrueFalse(q.id, optIndex, "F")}
                                className={`w-8 h-8 rounded-full text-xs font-bold border transition-all ${
                                  val === "F" ? "bg-rose-600 border-rose-600 text-white shadow-md scale-105" : "border-hairline hover:bg-rose-500/10 text-rose-600"
                                }`}
                              >
                                S
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : q.type === "SHORT_ANSWER" ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <label className="text-xs font-bold text-ink-muted-80">Nhập kết quả:</label>
                      <input
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                        placeholder="Nhập đáp số..."
                        className="bg-white/80 dark:bg-slate-800/80 border border-hairline rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-primary/50 w-full sm:w-64"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(q.options || []).map((opt, optIndex) => {
                        const isSelected = answers[q.id] === optIndex.toString();
                        return (
                          <button
                            key={optIndex}
                            onClick={() => handleSelectOption(q.id, optIndex)}
                            className={`flex items-center gap-3 text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-[1.01]"
                                : "bg-white/80 dark:bg-slate-800/80 border-hairline text-ink hover:bg-primary/5 hover:border-primary/40"
                            }`}
                          >
                            <span
                              className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isSelected ? "border-white bg-white text-primary" : "border-ink-muted-48 text-ink-muted-48"
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className="flex-1">
                              <MathRenderer text={opt} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="py-4 px-8 rounded-full bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:from-primary-focus hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/30 apple-active-scale transition-all w-full mt-4"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Đang chấm điểm bài làm...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Nộp bài và nhận kết quả</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 3. RESULT VIEW */}
        {quizStarted && quizResult && !showReview && (
          <div className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center max-w-lg mx-auto w-full animate-fade-in relative overflow-hidden">
            {quizResult.passed ? (
              <div className="h-20 w-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 animate-pulse">
                <Trophy className="h-10 w-10" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20">
                <AlertCircle className="h-10 w-10" />
              </div>
            )}

            <h2 className="font-tagline text-2xl font-extrabold text-ink mb-1">Kết Quả Bài Thi</h2>
            <p className="font-caption text-ink-muted-80 text-xs sm:text-sm mb-6 max-w-xs">
              Thí sinh: <strong>{guestName}</strong> • {quiz.title}
            </p>

            <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 border-4 border-primary/30 flex flex-col items-center justify-center mb-6 shadow-inner backdrop-blur-md">
              <span className="text-4xl font-black text-ink tracking-tight">{quizResult.score.toFixed(1)}</span>
              <span className="text-[10px] font-extrabold text-ink-muted-48 uppercase tracking-widest mt-1">Điểm số</span>
            </div>

            <div className="flex flex-col gap-2 w-full border-t border-hairline pt-6 mb-6">
              <span className={`text-sm font-extrabold uppercase tracking-wider ${quizResult.passed ? "text-emerald-600" : "text-rose-600"}`}>
                {quizResult.passed ? "🎉 Chúc mừng bạn đã vượt qua bài thi!" : "💪 Chưa đạt mục tiêu, hãy rèn luyện thêm!"}
              </span>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {quizResult.correctAnswers ? (
                <button
                  onClick={() => setShowReview(true)}
                  className="w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 apple-active-scale transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Xem đáp án & Lời giải chi tiết</span>
                </button>
              ) : quizResult.answerReview ? (
                <div className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-left">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Đáp án chưa được mở</p>
                  <p className="mt-1 text-xs text-ink-muted-80 leading-relaxed">{quizResult.answerReview.message}</p>
                  <button
                    onClick={handleCheckAnswerReview}
                    className="mt-3 w-full py-2.5 px-4 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs apple-active-scale transition-all"
                  >
                    Kiểm tra lại đáp án
                  </button>
                </div>
              ) : null}

              <Link
                href="/quizzes"
                className="w-full py-3.5 px-6 rounded-full bg-canvas/80 hover:bg-canvas border border-hairline text-ink font-bold text-xs sm:text-sm apple-active-scale transition-all text-center block"
              >
                Quay lại ngân hàng đề thi
              </Link>
            </div>
          </div>
        )}

        {/* 4. REVIEW VIEW */}
        {quizStarted && quizResult && showReview && quizResult.correctAnswers && (
          <div className="flex flex-col gap-6 max-w-[860px] mx-auto w-full animate-fade-in">
            <div className="backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border border-white/60 dark:border-white/15 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
              <div>
                <h3 className="font-tagline text-base font-extrabold text-ink">Chi Tiết Đáp Án & Lời Giải</h3>
                <p className="text-xs text-ink-muted-48">{quiz.title} • Thí sinh: {guestName}</p>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="bg-primary hover:bg-primary-focus text-white px-5 py-2.5 rounded-full text-xs font-bold apple-active-scale transition-all shadow-md"
              >
                Xem lại kết quả
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {(paper || []).map((q, qIndex) => {
                const reviewInfo = quizResult.correctAnswers?.find((ca) => ca.id === q.id);
                const studentAnsVal = (answers[q.id] || "").trim().toUpperCase();
                const correctAnsVal = (reviewInfo?.correctAnswer || "").trim().toUpperCase();
                let isCorrect = studentAnsVal === correctAnsVal;
                let scoreEarned = 0;
                let subCorrectText = "";

                if (q.type === "TRUE_FALSE") {
                  const studentParts = studentAnsVal.split(",");
                  const correctParts = correctAnsVal.split(",");
                  let subCorrect = 0;
                  for (let i = 0; i < Math.min(studentParts.length, correctParts.length); i++) {
                    if (studentParts[i] && correctParts[i] && studentParts[i].trim() === correctParts[i].trim()) {
                      subCorrect++;
                    }
                  }
                  subCorrectText = ` (${subCorrect}/4 ý)`;
                  if (subCorrect === 1) scoreEarned = 0.1 * q.score;
                  else if (subCorrect === 2) scoreEarned = 0.25 * q.score;
                  else if (subCorrect === 3) scoreEarned = 0.5 * q.score;
                  else if (subCorrect === 4) {
                    scoreEarned = q.score;
                    isCorrect = true;
                  }
                } else if (isCorrect) {
                  scoreEarned = q.score;
                }

                return (
                  <div
                    key={q.id}
                    className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 shadow-lg"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="font-body-strong text-sm sm:text-base text-ink font-bold leading-relaxed">
                        Câu {qIndex + 1}: <MathRenderer text={cleanQuestionText(q.questionText)} />
                      </h4>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex-shrink-0 border ${
                          isCorrect
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : scoreEarned > 0
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {isCorrect
                          ? `Đúng (${scoreEarned.toFixed(2)}đ)`
                          : scoreEarned > 0
                          ? `Đúng một phần${subCorrectText} (${scoreEarned.toFixed(2)}đ)`
                          : `Sai (0đ)`}
                      </span>
                    </div>

                    {q.imageUrl && q.imageUrl.trim() && (
                      <div className="my-2 border border-hairline rounded-2xl overflow-hidden max-w-full bg-canvas shadow-sm">
                        <img src={q.imageUrl} alt={`Minh họa câu ${qIndex + 1}`} className="w-full h-auto object-contain max-h-96" />
                      </div>
                    )}

                    {q.type === "MULTIPLE_CHOICE" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(q.options || []).map((opt, optIndex) => {
                          const isStudentSelect = answers[q.id] === optIndex.toString();
                          const isCorrectAnswer = reviewInfo?.correctAnswer === optIndex.toString();
                          let style = "bg-canvas/60 dark:bg-slate-800/60 border-hairline text-ink";
                          if (isStudentSelect) {
                            style = isCorrect
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold"
                              : "bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 font-bold";
                          } else if (isCorrectAnswer) {
                            style = "bg-emerald-500/10 border-emerald-500 border-dashed text-emerald-800 dark:text-emerald-300 font-bold";
                          }

                          return (
                            <div key={optIndex} className={`flex items-center gap-3 p-4 rounded-2xl border text-xs sm:text-sm ${style}`}>
                              <span
                                className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  isCorrectAnswer
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : isStudentSelect
                                    ? "bg-rose-600 border-rose-600 text-white"
                                    : "border-ink-muted-48 text-ink-muted-48"
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <div className="flex flex-1 flex-col gap-1">
                                <MathRenderer text={opt} />
                                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                  {isCorrectAnswer && <span className="text-emerald-600 dark:text-emerald-400">Đáp án đúng</span>}
                                  {isStudentSelect && <span className={isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>Bạn chọn</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === "TRUE_FALSE" && reviewInfo && (
                      <div className="flex flex-col gap-3 border border-hairline rounded-2xl p-4 bg-canvas/60 dark:bg-slate-800/60">
                        <div className="grid grid-cols-12 text-xs font-bold text-ink-muted-48 uppercase border-b border-hairline pb-2 mb-1">
                          <div className="col-span-6">Ý phát biểu</div>
                          <div className="col-span-3 text-center">Lựa chọn của bạn</div>
                          <div className="col-span-3 text-center">Đáp án đúng</div>
                        </div>
                        {(q.options || []).map((opt, optIndex) => {
                          const studentParts = (answers[q.id] || "-,-,-,-").split(",");
                          const correctParts = (reviewInfo.correctAnswer || "T,T,T,T").split(",");
                          const studVal = studentParts[optIndex] === "T" ? "Đúng" : studentParts[optIndex] === "F" ? "Sai" : "Chưa chọn";
                          const corrVal = correctParts[optIndex] === "T" ? "Đúng" : "Sai";
                          const rowCorrect = studentParts[optIndex] === correctParts[optIndex];
                          return (
                            <div key={optIndex} className="grid grid-cols-12 items-center gap-2 py-2 text-xs border-b border-hairline/60 last:border-0">
                              <div className="col-span-6 flex gap-2 font-medium">
                                <span className="font-bold text-primary">{String.fromCharCode(97 + optIndex)})</span>
                                <MathRenderer text={opt} />
                              </div>
                              <div className={`col-span-3 text-center font-bold ${rowCorrect ? "text-emerald-600" : "text-rose-600"}`}>{studVal}</div>
                              <div className="col-span-3 text-center font-bold text-emerald-600">{corrVal}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === "SHORT_ANSWER" && reviewInfo && (
                      <div className="flex flex-col gap-2 p-4 bg-canvas/60 dark:bg-slate-800/60 border border-hairline rounded-2xl text-xs sm:text-sm">
                        <div>
                          Bạn đã nhập: <strong className={isCorrect ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{answers[q.id] || "(Chưa nhập)"}</strong>
                        </div>
                        <div>
                          Đáp án chuẩn: <strong className="text-emerald-600 font-bold">{reviewInfo.correctAnswer}</strong>
                        </div>
                      </div>
                    )}

                    {reviewInfo?.explanation && (
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mt-1 text-xs sm:text-sm text-ink leading-relaxed">
                        <span className="font-bold text-primary flex items-center gap-1.5 mb-1">💡 Lời giải chi tiết:</span>
                        <MathRenderer text={reviewInfo.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
