"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, RefreshCw, CheckCircle2, Play } from "lucide-react";
import { submitQuiz } from "@/actions/quizzes";
import MathRenderer from "@/components/MathRenderer";
import Link from "next/link";
import { showToast } from "@/components/Toast";

interface Question {
  id: string;
  questionText: string;
  type: string;
  options: string[];
  correctAnswer: string;
  score: number;
  imageUrl?: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  passingScore: number;
  subjectName: string;
  isPublic: boolean | undefined;
  questions: Question[];
}

interface SingleQuizPlayerProps {
  quiz: Quiz;
  sessionUser: { name: string; role: string } | null;
}

export default function SingleQuizPlayer({ quiz, sessionUser }: SingleQuizPlayerProps) {
  const [guestName, setGuestName] = useState(sessionUser?.name || "");
  const [showNameModal, setShowNameModal] = useState(!sessionUser);
  const [quizStarted, setQuizStarted] = useState(!!sessionUser);
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    passed: boolean;
    correctAnswers?: { id: string; correctAnswer: string; explanation: string | null }[] | null;
  } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [isCheatedLocked, setIsCheatedLocked] = useState(false);
  const forceSubmitRef = useRef<(() => void) | null>(null);

  // Update forceSubmitRef with latest handleSubmit closure
  useEffect(() => {
    forceSubmitRef.current = handleSubmit;
  }, [answers, guestName, timeLeft]);

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

  // Countdown timer
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

  const [showRules, setShowRules] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleStartQuiz = () => {
    if (!guestName.trim()) {
      showToast("Vui lòng nhập Họ tên để bắt đầu làm bài thi thử.", "warning");
      return;
    }
    if (!agreed) {
      showToast("Vui lòng đồng ý với Nội quy phòng thi để tiếp tục.", "warning");
      return;
    }
    setTimeLeft(quiz.duration * 60);
    setAnswers({});
    setQuizResult(null);
    setShowReview(false);
    setQuizStarted(true);
    setShowRules(false);
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
    setSubmitting(true);

    try {
      const response = await submitQuiz({
        quizId: quiz.id,
        answers,
        guestName: sessionUser ? "" : guestName,
        timeExpired: timeLeft === 0,
      });

      if (response.success && response.data) {
        setQuizResult({
          score: response.data.score,
          maxScore: response.data.maxScore,
          passed: response.data.passed,
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

  const renderQuestionPlaying = (q: any, displayIdx: number) => {
    return (
      <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4 text-left">
        <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
          Câu {displayIdx}: <MathRenderer text={q.questionText} />
        </h3>
        
        {q.imageUrl && q.imageUrl.trim() && (
          <div className="my-2 border border-hairline rounded overflow-hidden max-w-full bg-canvas shadow-sm">
            <img src={q.imageUrl} alt={`Hình minh họa câu ${displayIdx}`} className="w-full h-auto object-contain rounded" />
          </div>
        )}
        
        {q.type === "TRUE_FALSE" ? (
          <div className="flex flex-col gap-3 border border-hairline rounded-lg p-4 bg-surface-pearl/50">
            <div className="grid grid-cols-12 text-[10px] font-bold text-ink-muted-48 uppercase border-b border-divider pb-2 mb-2">
              <div className="col-span-8">Ý phát biểu</div>
              <div className="col-span-2 text-center">Đúng</div>
              <div className="col-span-2 text-center">Sai</div>
            </div>
            {q.options.map((opt: string, optIndex: number) => {
              const currentAnswers = (answers[q.id] || "-,-,-,-").split(",");
              const val = currentAnswers[optIndex] || "-";
              return (
                <div key={optIndex} className="grid grid-cols-12 items-center gap-2 py-1 text-xs border-b border-divider-soft last:border-0 last:pb-0">
                  <div className="col-span-8 flex gap-2">
                    <span className="font-semibold text-ink-muted-80">{String.fromCharCode(97 + optIndex)})</span>
                    <MathRenderer text={opt} />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleSelectTrueFalse(q.id, optIndex, "T")}
                      className={`w-7 h-7 rounded-full text-[10px] font-bold border transition-colors ${
                        val === "T" ? "bg-green-600 border-green-600 text-white" : "border-ink-muted-48 hover:bg-green-50 text-green-700"
                      }`}
                    >
                      Đ
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleSelectTrueFalse(q.id, optIndex, "F")}
                      className={`w-7 h-7 rounded-full text-[10px] font-bold border transition-colors ${
                        val === "F" ? "bg-red-600 border-red-600 text-white" : "border-ink-muted-48 hover:bg-red-50 text-red-700"
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
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-caption-strong text-ink-muted-80">Nhập đáp số:</label>
            <input
              type="text"
              value={answers[q.id] || ""}
              onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
              placeholder="Nhập câu trả lời..."
              className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-xs text-ink outline-none focus:border-primary-focus w-48"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {q.options.map((opt: string, optIndex: number) => {
              const isSelected = answers[q.id] === optIndex.toString();
              return (
                <button
                  key={optIndex}
                  onClick={() => handleSelectOption(q.id, optIndex)}
                  className={`flex items-center gap-3 text-left p-3.5 rounded-pill border text-xs transition-colors ${
                    isSelected 
                      ? "bg-surface-pearl border-primary-focus text-primary font-semibold" 
                      : "bg-canvas border-divider-soft text-ink-muted-80 hover:bg-surface-pearl"
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? "border-primary bg-primary text-white" : "border-ink-muted-48 text-ink-muted-48"
                  }`}>
                    {String.fromCharCode(65 + optIndex)}
                  </span>
                  <MathRenderer text={opt} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderQuestionReview = (q: any, displayIdx: number, reviewInfo: any, studentAnsVal: string, correctAnsVal: string, isCorrect: boolean, scoreEarned: number, subCorrectText: string) => {
    return (
      <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4 text-left">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
            Câu {displayIdx}: <MathRenderer text={q.questionText} />
          </h3>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
            isCorrect 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : scoreEarned > 0
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {isCorrect ? `Đúng (${scoreEarned.toFixed(2)}đ)` : scoreEarned > 0 ? `Đúng một phần${subCorrectText} (${scoreEarned.toFixed(2)}đ)` : `Sai (0đ)`}
          </span>
        </div>
        
        {q.imageUrl && q.imageUrl.trim() && (
          <div className="my-2 border border-hairline rounded overflow-hidden max-w-full bg-canvas shadow-sm">
            <img src={q.imageUrl} alt={`Hình minh họa câu ${displayIdx}`} className="w-full h-auto object-contain rounded" />
          </div>
        )}

        {/* MCQ options review */}
        {q.type === "MULTIPLE_CHOICE" && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt: string, optIndex: number) => {
              const isStudentSelect = answers[q.id] === optIndex.toString();
              const isCorrectAnswer = reviewInfo?.correctAnswer === optIndex.toString();
              let btnStyle = "bg-canvas border-divider-soft text-ink-muted-80";
              if (isStudentSelect) {
                btnStyle = isCorrect ? "bg-green-50 border-green-500 text-green-800 font-semibold" : "bg-red-50 border-red-400 text-red-800 font-semibold";
              } else if (isCorrectAnswer) {
                btnStyle = "bg-green-50 border-green-500 text-green-800 border-dashed font-semibold";
              }
              return (
                <div
                  key={optIndex}
                  className={`flex items-center gap-3 p-3.5 rounded-pill border text-xs ${btnStyle}`}
                >
                  <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                    isCorrectAnswer ? "border-green-600 bg-green-600 text-white" : isStudentSelect ? "border-red-500 bg-red-500 text-white" : "border-ink-muted-48 text-ink-muted-48"
                  }`}>
                    {String.fromCharCode(65 + optIndex)}
                  </span>
                  <MathRenderer text={opt} />
                </div>
              );
            })}
          </div>
        )}

        {/* True/False options review */}
        {q.type === "TRUE_FALSE" && reviewInfo && (
          <div className="flex flex-col gap-3 border border-hairline rounded-lg p-4 bg-surface-pearl/50">
            <div className="grid grid-cols-12 text-[10px] font-bold text-ink-muted-48 uppercase border-b border-divider pb-2 mb-2">
              <div className="col-span-6">Ý phát biểu</div>
              <div className="col-span-3 text-center">Lựa chọn của bạn</div>
              <div className="col-span-3 text-center">Đáp án đúng</div>
            </div>
            {q.options.map((opt: string, optIndex: number) => {
              const studentParts = (answers[q.id] || "-,-,-,-").split(",");
              const correctParts = (reviewInfo.correctAnswer || "T,T,T,T").split(",");
              
              const studVal = studentParts[optIndex] === "T" ? "Đúng" : studentParts[optIndex] === "F" ? "Sai" : "Chưa chọn";
              const corrVal = correctParts[optIndex] === "T" ? "Đúng" : "Sai";
              
              const isPartCorrect = studentParts[optIndex] === correctParts[optIndex];
              const badgeStyle = isPartCorrect ? "text-green-700 bg-green-50 border border-green-200" : studVal === "Chưa chọn" ? "text-slate-600 bg-slate-50 border border-slate-200" : "text-red-700 bg-red-50 border border-red-200";
              
              return (
                <div key={optIndex} className="grid grid-cols-12 items-center gap-2 py-2 border-b border-divider-soft last:border-0 last:pb-0 text-left">
                  <div className="col-span-6 flex gap-2">
                    <span className="font-semibold text-ink-muted-80">{String.fromCharCode(97 + optIndex)})</span>
                    <MathRenderer text={opt} />
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${badgeStyle}`}>
                      {studVal}
                    </span>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium text-green-800 bg-green-50 border border-green-200">
                      {corrVal}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Short Answer review */}
        {q.type === "SHORT_ANSWER" && reviewInfo && (
          <div className="flex flex-col gap-2 p-3 bg-surface-pearl border border-divider-soft rounded-lg">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-ink-muted-80">Đáp án của bạn:</span>
              <span className={`px-3 py-1 rounded-pill font-bold ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {answers[q.id] || "(Trống)"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-ink-muted-80">Đáp án chính xác:</span>
              <span className="px-3 py-1 rounded-pill bg-green-100 text-green-800 font-bold">
                {reviewInfo.correctAnswer}
              </span>
            </div>
          </div>
        )}

        {/* Explanation guidance */}
        {q.explanation && q.explanation.trim() && (
          <div className="mt-4 border-t border-divider-soft pt-4 text-left">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">💡 Lời giải chi tiết:</span>
            <div className="text-xs text-ink-muted-80 bg-blue-50/50 border border-blue-100 rounded-lg p-3 leading-relaxed">
              <MathRenderer text={q.explanation} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-canvas-parchment min-h-screen py-8 px-4 flex flex-col gap-6 w-full">
      {/* 1. Intro screen (before start) */}
      {!quizStarted && !quizResult && !showRules && (
        <div className="w-full flex justify-center px-4">
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm max-w-xl w-full animate-fade-in flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full self-start">
                {quiz.subjectName}
              </span>
              <h1 className="font-tagline text-2xl font-bold text-ink leading-tight">
                {quiz.title}
              </h1>
              <p className="text-xs text-ink-muted-80 font-body">
                {quiz.description || "Đề ôn thi thử chất lượng cao bám sát chương trình mới kèm lời giải chi tiết."}
              </p>
            </div>

            <div className="border-t border-divider-soft pt-4 flex flex-col gap-3 text-xs text-ink-muted-80 font-body">
              <div className="flex justify-between">
                <span>Thời gian làm bài:</span>
                <strong className="text-ink">{quiz.duration} phút</strong>
              </div>
              <div className="flex justify-between">
                <span>Số câu hỏi:</span>
                <strong className="text-ink">{quiz.questions.length} câu</strong>
              </div>
              <div className="flex justify-between">
                <span>Mục tiêu đạt:</span>
                <strong className="text-ink">{quiz.passingScore.toFixed(1)} điểm</strong>
              </div>
              <div className="flex justify-between">
                <span>Loại đề:</span>
                <strong className="text-ink">{quiz.isPublic ? "Công khai (Miễn phí)" : "Nội bộ lớp học"}</strong>
              </div>
            </div>

            <button
              onClick={() => setShowRules(true)}
              className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-1.5"
            >
              Tiếp tục <Play className="h-3.5 w-3.5 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* 1.1 Rules & Name screen */}
      {!quizStarted && !quizResult && showRules && (
        <div className="w-full flex justify-center px-4">
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm max-w-xl w-full animate-fade-in flex flex-col gap-5">
            <div className="flex flex-col gap-1 border-b border-divider-soft pb-3">
              <h2 className="font-tagline text-lg font-bold text-ink flex items-center gap-2">
                📝 Quy Chế Phòng Thi & Chống Gian Lận
              </h2>
              <p className="text-[11px] text-ink-muted-80 font-body">
                Vui lòng xem kỹ trước khi bắt đầu tính giờ làm bài.
              </p>
            </div>

            {/* Rules List */}
            <div className="flex flex-col gap-3 text-xs text-ink-muted-80 font-body">
              <div className="flex gap-2 items-start bg-slate-50 border border-divider-soft p-3 rounded-lg">
                <span className="text-blue-600 font-bold flex-shrink-0">⚠️</span>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-ink">Thời gian làm bài liên tục:</strong>
                  <span>Thời gian sẽ đếm ngược ngay khi vào đề. Khi hết giờ, hệ thống sẽ tự động thu bài và nộp kết quả hiện tại.</span>
                </div>
              </div>

              <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <span className="text-amber-600 font-bold flex-shrink-0">🚫</span>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-amber-800">Cấm rời khỏi phòng thi (Chống chuyển tab):</strong>
                  <span className="text-amber-900">Không chuyển đổi tab, rời trình duyệt hay thu nhỏ cửa sổ. Hệ thống sẽ phát hiện ngay. Vi phạm quá <strong>3 lần</strong> sẽ tự động nộp bài và khóa kết quả thi của bạn.</span>
                </div>
              </div>

              <div className="flex gap-2 items-start bg-red-50 border border-red-200 p-3 rounded-lg">
                <span className="text-red-600 font-bold flex-shrink-0">🔒</span>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-red-800">Bảo mật đề thi:</strong>
                  <span className="text-red-900">EduWeb hiển thị Watermark bảo mật để chống sao chép và quay chụp màn hình trái phép.</span>
                </div>
              </div>
            </div>

            {/* Name input for Guests */}
            {!sessionUser && (
              <div className="flex flex-col gap-1.5 border-t border-divider-soft pt-4">
                <label className="text-xs font-semibold text-ink">Họ Tên Thí Sinh:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-xs text-ink outline-none focus:border-primary-focus w-full"
                  required
                />
              </div>
            )}

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-2.5 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-primary h-4 w-4"
              />
              <span className="text-xs text-ink font-semibold leading-relaxed">
                Tôi xác nhận đã đọc kỹ nội quy phòng thi và cam kết làm bài tự lực, trung thực.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowRules(false)}
                className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2.5 rounded-pill font-semibold"
              >
                Quay lại
              </button>
              <button
                onClick={handleStartQuiz}
                className="bg-primary hover:bg-primary-focus text-white text-xs px-6 py-2.5 rounded-pill font-semibold flex items-center gap-1.5"
              >
                Vào làm bài (Tính giờ) <Play className="h-3 w-3 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Quiz Player view */}
      {quizStarted && !quizResult && (
        <div 
          className="flex flex-col gap-6 max-w-[800px] mx-auto w-full animate-fade-in select-none relative"
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Floating Watermark for Anti-Screen Recording */}
          <div className="pointer-events-none fixed inset-0 z-20 flex flex-wrap gap-12 justify-center items-center overflow-hidden opacity-[0.02] select-none">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="text-ink font-bold text-xs transform -rotate-12 whitespace-nowrap">
                {guestName || "Thí sinh"} - Đang làm bài - CẤM QUAY MÀN HÌNH / SAO CHÉP
              </div>
            ))}
          </div>

          {/* Static Timer Info */}
          <div className="border border-hairline rounded-md p-4 flex items-center justify-between bg-surface-pearl mb-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-body-strong text-sm text-ink font-semibold">{quiz.title}</h2>
              <span className="text-[10px] text-ink-muted-48">Thí sinh: {guestName}</span>
            </div>
            <div className="flex items-center gap-2 text-red-600 font-mono font-bold text-sm bg-red-50 px-3 py-1 rounded-sm">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Questions Stack */}
          <div className="flex flex-col gap-6 mt-4 relative">
            {isCheatedLocked && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-8 rounded-lg text-white text-center min-h-[300px]">
                <span className="text-4xl mb-4">🔒</span>
                <h3 className="font-tagline text-base font-bold">Bài thi đã bị khóa</h3>
                <p className="text-xs text-slate-300 max-w-md mt-2">
                  Hệ thống ghi nhận bạn đã chuyển tab hoặc rời màn hình làm bài quá 3 lần. Bài thi của bạn đã bị tự động nộp.
                </p>
              </div>
            )}
            {/* PHẦN I */}
            {((() => {
              const part1Questions = (quiz.questions || []).filter(q => q.type === "MULTIPLE_CHOICE");
              return part1Questions.length > 0 && (
                <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                  <div className="border-b border-divider pb-2 mb-2 text-left">
                    <span className="text-xs font-bold text-slate-800 block">PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn</span>
                    <span className="text-[10px] text-ink-muted-48">Mỗi câu hỏi thí sinh chỉ chọn một phương án.</span>
                  </div>
                  {part1Questions.map((q, idx) => renderQuestionPlaying(q, idx + 1))}
                </div>
              );
            })())}

            {/* PHẦN II */}
            {((() => {
              const part2Questions = (quiz.questions || []).filter(q => q.type === "TRUE_FALSE");
              return part2Questions.length > 0 && (
                <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                  <div className="border-b border-divider pb-2 mb-2 text-left">
                    <span className="text-xs font-bold text-slate-800 block">PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai</span>
                    <span className="text-[10px] text-ink-muted-48">Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.</span>
                  </div>
                  {part2Questions.map((q, idx) => renderQuestionPlaying(q, idx + 1))}
                </div>
              );
            })())}

            {/* PHẦN III */}
            {((() => {
              const part3Questions = (quiz.questions || []).filter(q => q.type === "SHORT_ANSWER");
              return part3Questions.length > 0 && (
                <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                  <div className="border-b border-divider pb-2 mb-2 text-left">
                    <span className="text-xs font-bold text-slate-800 block">PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn</span>
                    <span className="text-[10px] text-ink-muted-48">Thí sinh trả lời đáp số ngắn vào ô trống.</span>
                  </div>
                  {part3Questions.map((q, idx) => renderQuestionPlaying(q, idx + 1))}
                </div>
              );
            })())}
          </div>

          {/* Submit Action */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              "Nộp bài thi"
            )}
          </button>
        </div>
      )}

      {/* 3. Quiz Result View */}
      {quizStarted && quizResult && !showReview && (
        <div className="w-full flex justify-center px-4">
          <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm flex flex-col items-center text-center max-w-[650px] w-full animate-fade-in">
            {quizResult.passed ? (
              <div className="h-14 w-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-red-500" />
              </div>
            )}

            <h2 className="font-tagline text-xl font-semibold text-ink mb-1">
              Kết quả của {guestName}
            </h2>
            <p className="font-caption text-ink-muted-80 text-xs mb-6 max-w-[400px]">
              {quiz.title}
            </p>

            <div className="h-24 w-24 rounded-full border-4 border-divider-soft flex flex-col items-center justify-center mb-6 bg-surface-pearl">
              <span className="text-2xl font-bold text-ink">{quizResult.score.toFixed(1)}</span>
              <span className="text-[9px] text-ink-muted-48 uppercase font-bold">Điểm đạt</span>
            </div>

            <div className="flex flex-col gap-2 w-full border-t border-divider-soft pt-4 mb-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                quizResult.passed ? "text-green-600" : "text-red-600"
              }`}>
                {quizResult.passed ? "Chúc mừng bạn đã đạt!" : "Rất tiếc bạn chưa đạt mục tiêu."}
              </span>
            </div>

            {quizResult.correctAnswers && (
              <button
                onClick={() => setShowReview(true)}
                className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-2"
              >
                Xem đáp án & lời giải chi tiết
              </button>
            )}

            <Link
              href="/quizzes"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4 block text-center"
            >
              Quay lại danh sách đề thi
            </Link>
          </div>
        </div>
      )}

      {/* 4. Quiz Review Mode */}
      {quizStarted && quizResult && showReview && quizResult.correctAnswers && (
        <div className="flex flex-col gap-6 max-w-[800px] mx-auto w-full animate-fade-in">
          <div className="flex justify-between items-center border-b border-divider pb-4 bg-canvas border border-hairline rounded-lg p-4 shadow-sm">
            <div>
              <h3 className="font-tagline text-base font-bold text-ink">Chi tiết đáp án & lời giải đề thi</h3>
              <p className="text-[10px] text-ink-muted-48">{quiz.title} • Thí sinh: {guestName}</p>
            </div>
            <button
              onClick={() => setShowReview(false)}
              className="bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-semibold"
            >
              Quay lại bảng điểm
            </button>
          </div>

          <div className="flex flex-col gap-6 mt-4">
            {/* PHẦN I Review */}
            {((() => {
              const part1Questions = (quiz.questions || []).map((q, idx) => ({ q, idx })).filter(item => item.q.type === "MULTIPLE_CHOICE");
              return part1Questions.length > 0 && (
                <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                  <div className="border-b border-divider pb-2 mb-2 text-left">
                    <span className="text-xs font-bold text-slate-800 block">PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn</span>
                  </div>
                  {part1Questions.map((item, index) => {
                    const q = item.q;
                    const reviewInfo = quizResult?.correctAnswers?.find((ca) => ca.id === q.id);
                    const studentAnsVal = (answers[q.id] || "").trim().toUpperCase();
                    const correctAnsVal = (reviewInfo?.correctAnswer || "").trim().toUpperCase();
                    const isCorrect = studentAnsVal === correctAnsVal;
                    const scoreEarned = isCorrect ? q.score : 0;
                    return renderQuestionReview(q, index + 1, reviewInfo, studentAnsVal, correctAnsVal, isCorrect, scoreEarned, "");
                  })}
                </div>
              );
            })())}

            {/* PHẦN II Review */}
            {((() => {
              const part2Questions = (quiz.questions || []).map((q, idx) => ({ q, idx })).filter(item => item.q.type === "TRUE_FALSE");
              return part2Questions.length > 0 && (
                <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                  <div className="border-b border-divider pb-2 mb-2 text-left">
                    <span className="text-xs font-bold text-slate-800 block">PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai</span>
                  </div>
                  {part2Questions.map((item, index) => {
                    const q = item.q;
                    const reviewInfo = quizResult?.correctAnswers?.find((ca) => ca.id === q.id);
                    const studentAnsVal = (answers[q.id] || "").trim().toUpperCase();
                    const correctAnsVal = (reviewInfo?.correctAnswer || "").trim().toUpperCase();
                    
                    const studentParts = studentAnsVal.split(",");
                    const correctParts = correctAnsVal.split(",");
                    let subCorrect = 0;
                    for (let i = 0; i < Math.min(studentParts.length, correctParts.length); i++) {
                      if (studentParts[i] && correctParts[i] && studentParts[i].trim() === correctParts[i].trim()) {
                        subCorrect++;
                      }
                    }
                    const subCorrectText = ` (${subCorrect}/4 ý)`;
                    let isCorrect = false;
                    let scoreEarned = 0;
                    if (subCorrect === 1) scoreEarned = 0.1 * q.score;
                    else if (subCorrect === 2) scoreEarned = 0.25 * q.score;
                    else if (subCorrect === 3) scoreEarned = 0.5 * q.score;
                    else if (subCorrect === 4) {
                      scoreEarned = q.score;
                      isCorrect = true;
                    }
                    
                    return renderQuestionReview(q, index + 1, reviewInfo, studentAnsVal, correctAnsVal, isCorrect, scoreEarned, subCorrectText);
                  })}
                </div>
              );
            })())}

            {/* PHẦN III Review */}
            {((() => {
              const part3Questions = (quiz.questions || []).map((q, idx) => ({ q, idx })).filter(item => item.q.type === "SHORT_ANSWER");
              return part3Questions.length > 0 && (
                <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                  <div className="border-b border-divider pb-2 mb-2 text-left">
                    <span className="text-xs font-bold text-slate-800 block">PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn</span>
                  </div>
                  {part3Questions.map((item, index) => {
                    const q = item.q;
                    const reviewInfo = quizResult?.correctAnswers?.find((ca) => ca.id === q.id);
                    const studentAnsVal = (answers[q.id] || "").trim().toUpperCase();
                    const correctAnsVal = (reviewInfo?.correctAnswer || "").trim().toUpperCase();
                    const isCorrect = studentAnsVal === correctAnsVal;
                    const scoreEarned = isCorrect ? q.score : 0;
                    return renderQuestionReview(q, index + 1, reviewInfo, studentAnsVal, correctAnsVal, isCorrect, scoreEarned, "");
                  })}
                </div>
              );
            })())}
          </div>
        </div>
      )}    </div>
  );
}
