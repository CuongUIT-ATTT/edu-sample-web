"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Lock,
  ArrowLeft,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronRight,
  GraduationCap,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import MathRenderer from "@/components/MathRenderer";
import { submitQuiz, startQuizAttempt } from "@/actions/quizzes";
import { cleanQuestionText } from "@/lib/quiz-shuffle";
import { showToast } from "@/components/Toast";
import StitchIconBadge from "@/components/ui/stitch/StitchIconBadge";

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  score: number;
  imageUrl?: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
  deadline?: string | null;
  category: string;
  questions: Question[];
}

export default function PublicQuizzesClient({ initialQuizzes }: { initialQuizzes: Quiz[] }) {
  const [quizzes] = useState<Quiz[]>(initialQuizzes);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [guestName, setGuestName] = useState("");
  const guestNameInputRef = useRef<HTMLInputElement | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [tempSelectedQuiz, setTempSelectedQuiz] = useState<Quiz | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    passed: boolean;
    isLate?: boolean;
    correctAnswers?: { id: string; correctAnswer: string; explanation: string | null }[] | null;
  } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [isCheatedLocked, setIsCheatedLocked] = useState(false);
  const [paper, setPaper] = useState<Question[] | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examCode, setExamCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const forceSubmitRef = useRef<(() => void) | null>(null);

  // Update forceSubmitRef with latest handleSubmit closure
  useEffect(() => {
    forceSubmitRef.current = handleSubmit;
  }, [answers, timeLeft, selectedQuiz]);

  // Anti-cheating logic (Tab switching / Blur detection)
  useEffect(() => {
    if (!quizStarted || quizResult || isCheatedLocked) return;

    let lastWarningTime = 0;

    const triggerWarning = () => {
      const now = Date.now();
      if (now - lastWarningTime < 2000) return; // Debounce alerts
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
          showToast(`CẢNH BÁO GIAN LẬN: Bạn không được rời màn hình làm bài! Lần vi phạm: ${next}/3. Quá 3 lần bài thi sẽ tự động khóa và nộp bài.`, "warning");
          return next;
        }
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        triggerWarning();
      }
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

  // Handle timer
  useEffect(() => {
    if (!quizStarted || timeLeft <= 0 || quizResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizResult]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (quizStarted && timeLeft === 0 && !quizResult) {
      handleSubmit();
    }
  }, [timeLeft]);

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
    return "";
  };

  const handleOpenNamePrompt = (quiz: Quiz) => {
    setTempSelectedQuiz(quiz);
    setShowRules(true);
    setRulesAccepted(false);
  };

  const handleStartQuiz = async () => {
    const currentGuestName = readGuestName();
    if (!currentGuestName.trim()) {
      showToast("Vui lòng nhập Họ tên để bắt đầu làm bài thi thử.", "warning");
      return;
    }
    if (!rulesAccepted) {
      showToast("Vui lòng đọc kỹ nội quy và tích vào ô cam kết trước khi bắt đầu.", "warning");
      return;
    }
    if (!tempSelectedQuiz) return;
    if (starting) return;

    setStarting(true);
    setSelectedQuiz(tempSelectedQuiz);
    if (tempSelectedQuiz.deadline && Date.now() > new Date(tempSelectedQuiz.deadline).getTime()) {
      showToast("Đề đã quá hạn — bài làm của bạn sẽ được đánh dấu Nộp muộn.", "warning");
    }
    try {
      setGuestName(currentGuestName);
      const res = await startQuizAttempt({
        quizId: tempSelectedQuiz.id,
        guestName: currentGuestName,
      });
      if (res.success && res.data) {
        setPaper(res.data.questions);
        setAttemptId(res.data.attemptId);
        setExamCode(res.data.examCode);
        setTimeLeft(tempSelectedQuiz.duration * 60);
        setAnswers({});
        setQuizResult(null);
        setShowReview(false);
        setQuizStarted(true);
        setShowNameModal(false);
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
    if (!selectedQuiz) return;
    setSubmitting(true);

    try {
      const response = await submitQuiz({
        quizId: selectedQuiz.id,
        answers,
        guestName,
        timeExpired: timeLeft === 0,
        attemptId: attemptId || undefined,
      });

      if (response.success && response.data) {
        setQuizResult({
          score: response.data.score,
          maxScore: response.data.maxScore,
          passed: response.data.passed,
          isLate: response.data.isLate,
          correctAnswers: response.data.correctAnswers,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-canvas text-ink py-12 px-4 sm:px-6 overflow-hidden transition-colors duration-300">
      {/* Radiant Background Blur Orbs */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,204,0.12),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.1),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_55%)]" />

      <div className="max-w-[1120px] mx-auto flex flex-col gap-10 relative z-10">
        {/* Back navigation button when inside quiz */}
        {quizStarted && !quizResult && (
          <button
            onClick={() => setQuizStarted(false)}
            className="group inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-focus backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 px-4 py-2.5 rounded-full shadow-md apple-active-scale self-start transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Thoát phòng thi</span>
          </button>
        )}

        {/* 1. QUIZ LISTING VIEW */}
        {!quizStarted && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header Section */}
            <div className="text-center flex flex-col gap-4 items-center max-w-3xl mx-auto pt-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 backdrop-blur-md px-4 py-1.5 rounded-full shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Ngân Hàng Đề Thi Thực Chiến 2026-2027
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-ink via-primary to-indigo-600 dark:from-white dark:via-sky-400 dark:to-indigo-300 bg-clip-text text-transparent leading-tight">
                Thi Thử Trực Tuyến Miễn Phí
              </h1>

              <p className="font-lead text-ink-muted-80 text-sm sm:text-base max-w-2xl leading-relaxed">
                Đề trắc nghiệm chuẩn cấu trúc mới Bộ GD&ĐT. Làm bài ngay không cần tài khoản, trả kết quả & lời giải chi tiết tức thì.
              </p>
            </div>

            {/* Search Bar & Stats Bar */}
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StitchIconBadge icon={BookOpen} variant="blue" size="md" />
                <div>
                  <h3 className="font-body-strong text-base font-bold text-ink">
                    Đề thi khả dụng ({filteredQuizzes.length})
                  </h3>
                  <p className="text-xs text-ink-muted-48">Cập nhật đề thi thử chính thức và phát triển hàng tuần</p>
                </div>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48" />
                <input
                  type="text"
                  placeholder="Tìm theo tên đề, môn học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-canvas/80 dark:bg-slate-800/80 border border-hairline rounded-full text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-ink-muted-48"
                />
              </div>
            </div>

            {/* Quizzes Bento Grid */}
            {filteredQuizzes.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 rounded-3xl p-16 text-center shadow-lg">
                <Award className="h-16 w-16 text-ink-muted-48 mx-auto mb-4 animate-bounce" />
                <p className="font-body text-base font-semibold text-ink-muted-80">
                  Không tìm thấy đề thi phù hợp với từ khóa "{searchTerm}".
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-xs font-bold text-primary hover:underline"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="group relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 hover:bg-white/95 dark:hover:bg-slate-900/95 border border-white/60 dark:border-white/15 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Top ambient glow */}
                    <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />

                    <div className="flex flex-col gap-4 relative z-10">
                      <div className="flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">
                          <GraduationCap className="h-3.5 w-3.5" />
                          {quiz.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Miễn phí
                        </span>
                      </div>

                      <h3 className="font-body-strong text-lg font-extrabold text-ink line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {quiz.title}
                      </h3>

                      <p className="font-caption text-ink-muted-80 text-xs leading-relaxed line-clamp-3">
                        {quiz.description ||
                          "Đề ôn thi thử chất lượng cao bám sát chương trình THPT Quốc Gia mới kèm lời giải chi tiết."}
                      </p>

                      {/* Meta Information Pills */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-ink-muted-80 border-t border-hairline pt-4 mt-1">
                        <div className="flex items-center gap-1.5 bg-canvas/60 dark:bg-slate-800/60 p-2 rounded-xl border border-hairline justify-center">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          <span>{quiz.duration} phút</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-canvas/60 dark:bg-slate-800/60 p-2 rounded-xl border border-hairline justify-center">
                          <HelpCircle className="h-3.5 w-3.5 text-purple-500" />
                          <span>{quiz.questions.length} câu</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-canvas/60 dark:bg-slate-800/60 p-2 rounded-xl border border-hairline justify-center">
                          <Award className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{quiz.passingScore.toFixed(1)}đ</span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => handleOpenNamePrompt(quiz)}
                      className="mt-6 w-full py-3 px-5 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-focus hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 apple-active-scale transition-all group/btn"
                    >
                      <span>Vào thi ngay</span>
                      <Play className="h-3.5 w-3.5 fill-current transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Information Banner */}
            <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/10 via-primary/5 to-purple-500/10 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-5 mt-4">
              <StitchIconBadge icon={ShieldCheck} variant="indigo" size="lg" className="flex-shrink-0" />
              <div className="flex flex-col gap-1.5">
                <h4 className="font-body-strong text-sm sm:text-base font-bold text-ink flex items-center gap-2">
                  Quyền lợi đặc quyền khi Đăng ký VIP EduWeb
                </h4>
                <p className="text-xs sm:text-sm text-ink-muted-80 leading-relaxed font-body">
                  Để ghi nhận bảng điểm chi tiết, lịch sử làm bài, phân tích lỗ hổng kiến thức AI và tham gia thi đấu xếp hạng toàn trung tâm, học viên hãy đăng nhập tài khoản VIP hoặc tham khảo lộ trình tại{" "}
                  <Link href="/admission" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                    Trang tuyển sinh <ChevronRight className="h-3 w-3" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. INTERACTIVE QUIZ PLAYER VIEW */}
        {quizStarted && !quizResult && selectedQuiz && (
          <div
            className="flex flex-col gap-6 max-w-[860px] mx-auto w-full select-none relative animate-fade-in"
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Watermark for Anti-Screen Recording */}
            <div className="pointer-events-none fixed inset-0 z-20 flex flex-wrap gap-16 justify-center items-center overflow-hidden opacity-[0.025] select-none">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="text-ink font-bold text-xs transform -rotate-12 whitespace-nowrap">
                  {guestName || "Thí sinh"} - Đang thi thử - CẤM SAO CHÉP / QUAY MÀN HÌNH
                </div>
              ))}
            </div>

            {/* Floating Glass Exam Header */}
            <div className="sticky top-20 z-30 backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border border-white/60 dark:border-white/15 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <h2 className="font-body-strong text-sm sm:text-base text-ink font-extrabold truncate">
                  {selectedQuiz.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-ink-muted-80 flex-wrap">
                  <span className="font-semibold text-primary">Thí sinh: {guestName}</span>
                  {examCode && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-primary border border-blue-500/20 font-bold text-[11px]">
                      Mã đề: {examCode.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-mono font-bold text-base sm:text-lg bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full shadow-inner flex-shrink-0">
                <Clock className="h-5 w-5 animate-pulse text-red-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Questions Stack */}
            <div className="flex flex-col gap-8 relative mt-2">
              {isCheatedLocked && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 rounded-3xl text-white text-center min-h-[360px] shadow-2xl">
                  <Lock className="h-16 w-16 text-red-400 mb-4 animate-bounce" />
                  <h3 className="font-tagline text-xl font-bold text-white">Bài Thi Đã Bị Khóa Tự Động</h3>
                  <p className="text-sm text-slate-300 max-w-md mt-2 leading-relaxed">
                    Hệ thống ghi nhận bạn đã chuyển tab hoặc rời màn hình làm bài quá 3 lần. Bài làm của bạn đã được tự động thu và chấm điểm.
                  </p>
                </div>
              )}

              {/* PHẦN I: Trắc nghiệm MCQ */}
              {(paper || []).some((q) => q.type === "MULTIPLE_CHOICE") && (
                <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
                  <div className="flex items-center gap-3 border-b border-hairline pb-4">
                    <StitchIconBadge icon={Zap} variant="blue" size="sm" />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-ink uppercase tracking-wide">
                        PHẦN I. Trắc nghiệm nhiều phương án lựa chọn
                      </h3>
                      <p className="text-xs text-ink-muted-48">Mỗi câu hỏi thí sinh chọn duy nhất một phương án đúng</p>
                    </div>
                  </div>

                  {(paper || [])
                    .filter((q) => q.type === "MULTIPLE_CHOICE")
                    .map((q, qIndex) => (
                      <div key={q.id} className="flex flex-col gap-4 border-b border-hairline pb-6 last:border-0 last:pb-0">
                        <h4 className="font-body-strong text-sm sm:text-base text-ink font-bold leading-relaxed">
                          Câu {qIndex + 1}: <MathRenderer text={cleanQuestionText(q.text)} />
                        </h4>
                        {q.imageUrl && q.imageUrl.trim() && (
                          <div className="my-2 border border-hairline rounded-2xl overflow-hidden max-w-full bg-canvas shadow-sm">
                            <img
                              src={q.imageUrl}
                              alt={`Minh họa câu ${qIndex + 1}`}
                              className="w-full h-auto object-contain max-h-96"
                            />
                          </div>
                        )}

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
                                    isSelected
                                      ? "border-white bg-white text-primary"
                                      : "border-ink-muted-48 text-ink-muted-48"
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
                      </div>
                    ))}
                </div>
              )}

              {/* PHẦN II: Đúng/Sai */}
              {(paper || []).some((q) => q.type === "TRUE_FALSE") && (
                <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
                  <div className="flex items-center gap-3 border-b border-hairline pb-4">
                    <StitchIconBadge icon={CheckCircle2} variant="amber" size="sm" />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-ink uppercase tracking-wide">
                        PHẦN II. Trắc nghiệm Đúng/Sai
                      </h3>
                      <p className="text-xs text-ink-muted-48">Trong mỗi ý a), b), c), d), chọn Đúng hoặc Sai</p>
                    </div>
                  </div>

                  {(paper || [])
                    .filter((q) => q.type === "TRUE_FALSE")
                    .map((q, qIndex) => (
                      <div key={q.id} className="flex flex-col gap-4 border-b border-hairline pb-6 last:border-0 last:pb-0">
                        <h4 className="font-body-strong text-sm sm:text-base text-ink font-bold leading-relaxed">
                          Câu {qIndex + 1}: <MathRenderer text={cleanQuestionText(q.text)} />
                        </h4>
                        {q.imageUrl && q.imageUrl.trim() && (
                          <div className="my-2 border border-hairline rounded-2xl overflow-hidden max-w-full bg-canvas shadow-sm">
                            <img src={q.imageUrl} alt={`Minh họa câu ${qIndex + 1}`} className="w-full h-auto object-contain max-h-96" />
                          </div>
                        )}

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
                              <div
                                key={optIndex}
                                className="grid grid-cols-12 items-center gap-2 py-2 border-b border-hairline/60 last:border-0 text-xs sm:text-sm"
                              >
                                <div className="col-span-8 sm:col-span-9 flex gap-2 font-medium">
                                  <span className="font-bold text-primary">{String.fromCharCode(97 + optIndex)})</span>
                                  <MathRenderer text={opt} />
                                </div>
                                <div className="col-span-2 sm:col-span-1.5 flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectTrueFalse(q.id, optIndex, "T")}
                                    className={`w-8 h-8 rounded-full text-xs font-bold border transition-all ${
                                      val === "T"
                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md scale-105"
                                        : "border-hairline hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
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
                                      val === "F"
                                        ? "bg-rose-600 border-rose-600 text-white shadow-md scale-105"
                                        : "border-hairline hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    }`}
                                  >
                                    S
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* PHẦN III: Trả lời ngắn */}
              {(paper || []).some((q) => q.type === "SHORT_ANSWER") && (
                <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
                  <div className="flex items-center gap-3 border-b border-hairline pb-4">
                    <StitchIconBadge icon={BookOpen} variant="emerald" size="sm" />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-ink uppercase tracking-wide">
                        PHẦN III. Câu hỏi trả lời ngắn
                      </h3>
                      <p className="text-xs text-ink-muted-48">Nhập kết quả hoặc đáp số ngắn vào ô bên dưới</p>
                    </div>
                  </div>

                  {(paper || [])
                    .filter((q) => q.type === "SHORT_ANSWER")
                    .map((q, qIndex) => (
                      <div key={q.id} className="flex flex-col gap-4 border-b border-hairline pb-6 last:border-0 last:pb-0">
                        <h4 className="font-body-strong text-sm sm:text-base text-ink font-bold leading-relaxed">
                          Câu {qIndex + 1}: <MathRenderer text={cleanQuestionText(q.text)} />
                        </h4>
                        {q.imageUrl && q.imageUrl.trim() && (
                          <div className="my-2 border border-hairline rounded-2xl overflow-hidden max-w-full bg-canvas shadow-sm">
                            <img src={q.imageUrl} alt={`Minh họa câu ${qIndex + 1}`} className="w-full h-auto object-contain max-h-96" />
                          </div>
                        )}

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
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Submit Action Button */}
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

        {/* 3. QUIZ RESULT VIEW */}
        {quizStarted && quizResult && selectedQuiz && !showReview && (
          <div className="backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center max-w-lg mx-auto w-full animate-fade-in relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

            {quizResult.passed ? (
              <div className="h-20 w-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 animate-pulse">
                <Trophy className="h-10 w-10" />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20">
                <AlertCircle className="h-10 w-10" />
              </div>
            )}

            <h2 className="font-tagline text-2xl font-extrabold text-ink mb-1">
              Kết Quả Bài Thi Thử
            </h2>
            <p className="font-caption text-ink-muted-80 text-xs sm:text-sm mb-6 max-w-xs">
              Thí sinh: <strong>{guestName}</strong> • {selectedQuiz.title}
            </p>

            {/* Score Ring / Card */}
            <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 border-4 border-primary/30 flex flex-col items-center justify-center mb-6 shadow-inner backdrop-blur-md">
              <span className="text-4xl font-black text-ink tracking-tight">
                {quizResult.score.toFixed(1)}
              </span>
              <span className="text-[10px] font-extrabold text-ink-muted-48 uppercase tracking-widest mt-1">
                Điểm số
              </span>
            </div>

            <div className="flex flex-col gap-2 w-full border-t border-hairline pt-6 mb-6">
              <span
                className={`text-sm font-extrabold uppercase tracking-wider ${
                  quizResult.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {quizResult.passed ? "🎉 Chúc mừng bạn đã vượt qua bài thi!" : "💪 Chưa đạt mục tiêu, hãy rèn luyện thêm!"}
              </span>
              {quizResult.isLate && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold uppercase tracking-wider self-center mt-1">
                  Đã nộp muộn
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full">
              {quizResult.correctAnswers && (
                <button
                  onClick={() => setShowReview(true)}
                  className="w-full py-3.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 apple-active-scale transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Xem đáp án & Lời giải chi tiết</span>
                </button>
              )}

              <button
                onClick={() => {
                  setQuizStarted(false);
                  setSelectedQuiz(null);
                  setQuizResult(null);
                }}
                className="w-full py-3.5 px-6 rounded-full bg-canvas/80 hover:bg-canvas border border-hairline text-ink font-bold text-xs sm:text-sm apple-active-scale transition-all"
              >
                Trở về ngân hàng đề thi
              </button>
            </div>
          </div>
        )}

        {/* 4. QUIZ REVIEW MODE */}
        {quizStarted && quizResult && selectedQuiz && showReview && quizResult.correctAnswers && (
          <div className="flex flex-col gap-6 max-w-[860px] mx-auto w-full animate-fade-in">
            <div className="backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border border-white/60 dark:border-white/15 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
              <div>
                <h3 className="font-tagline text-base font-extrabold text-ink">Chi Tiết Đáp Án & Lời Giải</h3>
                <p className="text-xs text-ink-muted-48">{selectedQuiz.title} • Thí sinh: {guestName}</p>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="bg-primary hover:bg-primary-focus text-white px-5 py-2.5 rounded-full text-xs font-bold apple-active-scale transition-all shadow-md"
              >
                Xem lại kết quả
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {(() => {
                const renderReviewQuestion = (q: Question, qIndex: number) => {
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
                  } else {
                    if (isCorrect) scoreEarned = q.score;
                  }

                  return (
                    <div
                      key={q.id}
                      className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 shadow-lg"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-body-strong text-sm sm:text-base text-ink font-bold leading-relaxed">
                          Câu {qIndex + 1}: <MathRenderer text={cleanQuestionText(q.text)} />
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
                                <MathRenderer text={opt} />
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
                          <span className="font-bold text-primary flex items-center gap-1.5 mb-1">
                            💡 Lời giải chi tiết:
                          </span>
                          <MathRenderer text={reviewInfo.explanation} />
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {(paper || []).some((q) => q.type === "MULTIPLE_CHOICE") && (
                      <div className="flex flex-col gap-6">
                        {(paper || [])
                          .filter((q) => q.type === "MULTIPLE_CHOICE")
                          .map((q, i) => renderReviewQuestion(q, i))}
                      </div>
                    )}

                    {(paper || []).some((q) => q.type === "TRUE_FALSE") && (
                      <div className="flex flex-col gap-6">
                        {(paper || [])
                          .filter((q) => q.type === "TRUE_FALSE")
                          .map((q, i) => renderReviewQuestion(q, i))}
                      </div>
                    )}

                    {(paper || []).some((q) => q.type === "SHORT_ANSWER") && (
                      <div className="flex flex-col gap-6">
                        {(paper || [])
                          .filter((q) => q.type === "SHORT_ANSWER")
                          .map((q, i) => renderReviewQuestion(q, i))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Rules & Name Glass Modal */}
      {showRules && tempSelectedQuiz && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-white/15 rounded-3xl w-[560px] max-w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-modal-pop">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-hairline flex flex-col gap-1">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Xác nhận dự thi</span>
              <h3 className="font-tagline text-lg font-extrabold text-ink">Quy Chế Phòng Thi & Nhập Họ Tên</h3>
              <p className="text-xs text-ink-muted-48">
                Đề thi: <strong>{tempSelectedQuiz.title}</strong> ({tempSelectedQuiz.duration} phút)
              </p>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col gap-5 p-6 overflow-y-auto flex-1 text-xs sm:text-sm text-ink font-body leading-relaxed">
              <div className="flex flex-col gap-2 bg-canvas/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-hairline">
                <h4 className="font-bold text-primary flex items-center gap-1.5">⏰ Thời gian & Chống gian lận</h4>
                <ul className="list-disc list-inside space-y-1 text-ink-muted-80 text-xs">
                  <li>Thời gian đếm ngược ngay khi bắt đầu. Tự động nộp bài khi hết thời gian.</li>
                  <li>Cấm chuyển tab hay rời màn hình. Vi phạm quá 3 lần sẽ bị khóa bài thi.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-ink flex items-center gap-1">
                  <span>Họ và Tên Thí Sinh</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  ref={guestNameInputRef}
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-hairline rounded-full px-5 py-3 text-xs sm:text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-ink-muted-48"
                  required
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none bg-primary/5 p-3.5 rounded-2xl border border-primary/15">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary rounded"
                />
                <span className="text-xs font-semibold text-ink leading-snug">
                  Tôi cam kết đọc kỹ quy chế, làm bài trung thực và tuân thủ mọi quy định phòng thi.
                </span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-hairline bg-canvas/40">
              <button
                onClick={() => {
                  setShowRules(false);
                  setTempSelectedQuiz(null);
                  setRulesAccepted(false);
                }}
                className="px-5 py-2.5 rounded-full border border-hairline hover:bg-canvas text-xs font-bold text-ink transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleStartQuiz}
                disabled={!rulesAccepted || !guestName.trim()}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-focus hover:to-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed apple-active-scale transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Bắt đầu thi ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
