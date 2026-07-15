"use client";

import React, { useState, useEffect } from "react";
import { Clock, RefreshCw, CheckCircle2, Play } from "lucide-react";
import { submitQuiz } from "@/actions/quizzes";
import MathRenderer from "@/components/MathRenderer";
import Link from "next/link";

interface Question {
  id: string;
  questionText: string;
  type: string;
  options: string[];
  correctAnswer: string;
  score: number;
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

  const handleStartQuiz = () => {
    if (!guestName.trim()) {
      alert("Vui lòng nhập Họ tên để bắt đầu làm bài thi thử.");
      return;
    }
    setTimeLeft(quiz.duration * 60);
    setAnswers({});
    setQuizResult(null);
    setShowReview(false);
    setQuizStarted(true);
    setShowNameModal(false);
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
        alert(response.error || "Có lỗi xảy ra khi nộp bài.");
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

  return (
    <div className="bg-canvas-parchment min-h-screen py-8 px-4 flex flex-col gap-6">
      {/* 1. Intro screen (before start) */}
      {!quizStarted && !quizResult && (
        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm max-w-xl mx-auto w-full animate-fade-in flex flex-col gap-4">
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
            onClick={() => {
              if (sessionUser) {
                setQuizStarted(true);
              } else {
                setShowNameModal(true);
              }
            }}
            className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-1.5"
          >
            Bắt đầu làm bài <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      )}

      {/* 2. Interactive Quiz Player view */}
      {quizStarted && !quizResult && (
        <div className="flex flex-col gap-6 max-w-[800px] mx-auto w-full animate-fade-in">
          {/* Sticky Timer Info */}
          <div className="sticky top-[60px] z-30 frosted-glass border border-hairline rounded-md p-4 flex items-center justify-between shadow-sm">
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
          <div className="flex flex-col gap-6 mt-4">
            {quiz.questions.map((q, qIndex) => (
              <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
                <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
                  Câu {qIndex + 1}: <MathRenderer text={q.questionText} />
                </h3>
                
                {q.type === "TRUE_FALSE" ? (
                  <div className="flex flex-col gap-3 border border-hairline rounded-lg p-4 bg-surface-pearl/50">
                    <div className="grid grid-cols-12 text-[10px] font-bold text-ink-muted-48 uppercase border-b border-divider pb-2 mb-2">
                      <div className="col-span-8">Ý phát biểu</div>
                      <div className="col-span-2 text-center">Đúng</div>
                      <div className="col-span-2 text-center">Sai</div>
                    </div>
                    {q.options.map((opt, optIndex) => {
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
                    {q.options.map((opt, optIndex) => {
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
            ))}
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
        <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm flex flex-col items-center text-center max-w-[650px] mx-auto w-full animate-fade-in">
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
            {quiz.questions.map((q, qIndex) => {
              const reviewInfo = quizResult.correctAnswers?.find((ca) => ca.id === q.id);
              const studentAnsVal = (answers[q.id] || "").trim().toUpperCase();
              const correctAnsVal = (reviewInfo?.correctAnswer || "").trim().toUpperCase();
              const isCorrect = studentAnsVal === correctAnsVal;

              return (
                <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
                      Câu {qIndex + 1}: <MathRenderer text={q.questionText} />
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isCorrect ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {isCorrect ? "Đúng" : "Sai"}
                    </span>
                  </div>

                  {/* MCQ options review */}
                  {q.type === "MULTIPLE_CHOICE" && (
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt, optIndex) => {
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
                      {q.options.map((opt, optIndex) => {
                        const studentParts = (answers[q.id] || "-,-,-,-").split(",");
                        const correctParts = (reviewInfo.correctAnswer || "T,T,T,T").split(",");
                        
                        const studVal = studentParts[optIndex] === "T" ? "Đúng" : studentParts[optIndex] === "F" ? "Sai" : "Chưa chọn";
                        const corrVal = correctParts[optIndex] === "T" ? "Đúng" : "Sai";
                        const rowCorrect = studentParts[optIndex] === correctParts[optIndex];

                        return (
                          <div key={optIndex} className="grid grid-cols-12 items-center gap-2 py-1 text-xs border-b border-divider-soft last:border-0 last:pb-0">
                            <div className="col-span-6 flex gap-2">
                              <span className="font-semibold text-ink-muted-80">{String.fromCharCode(97 + optIndex)})</span>
                              <MathRenderer text={opt} />
                            </div>
                            <div className={`col-span-3 text-center font-bold ${rowCorrect ? "text-green-700" : "text-red-600"}`}>
                              {studVal}
                            </div>
                            <div className="col-span-3 text-center font-bold text-green-700">
                              {corrVal}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer review */}
                  {q.type === "SHORT_ANSWER" && reviewInfo && (
                    <div className="flex flex-col gap-2 bg-surface-pearl/50 p-4 border border-divider-soft rounded-lg text-xs font-body">
                      <div>
                        Bạn đã trả lời: <strong className={isCorrect ? "text-green-700 font-bold" : "text-red-600 font-bold"}>{answers[q.id] || "(Chưa nhập)"}</strong>
                      </div>
                      <div>
                        Đáp án đúng: <strong className="text-green-700 font-bold">{reviewInfo.correctAnswer}</strong>
                      </div>
                    </div>
                  )}

                  {/* Explanation card */}
                  {reviewInfo?.explanation && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2 flex flex-col gap-1 text-xs text-blue-900 font-body">
                      <span className="font-bold flex items-center gap-1">💡 Lời giải chi tiết:</span>
                      <MathRenderer text={reviewInfo.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Guest Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[400px] max-w-full shadow-product flex flex-col overflow-hidden animate-fade-in p-6">
            <h3 className="font-tagline text-base font-semibold text-ink mb-2">Nhập Họ Tên Thí Sinh</h3>
            <p className="text-xs text-ink-muted-80 mb-4">
              Vui lòng cung cấp Họ tên để lưu thông tin bài thi thử cho đề: <strong>{quiz.title}</strong>
            </p>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-xs text-ink outline-none focus:border-primary-focus w-full mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNameModal(false)}
                className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2 rounded-pill font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleStartQuiz}
                className="bg-primary hover:bg-primary-focus text-white text-xs px-5 py-2 rounded-pill font-semibold"
              >
                Bắt đầu làm bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
