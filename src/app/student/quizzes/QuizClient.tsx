"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckSquare, Award, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { submitQuiz } from "@/actions/quizzes";

interface Question {
  id: string;
  text: string;
  options: string[];
  score: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  passingScore: number;
  questions: Question[];
}

export default function QuizClient({ quizzes }: { quizzes: Quiz[] }) {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    passed: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setTimeLeft(quiz.duration * 60);
    setAnswers({});
    setQuizResult(null);
    setQuizStarted(true);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex.toString(),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedQuiz) return;
    setSubmitting(true);

    try {
      const response = await submitQuiz({
        quizId: selectedQuiz.id,
        answers,
      });

      if (response.success && response.data) {
        setQuizResult({
          score: response.data.score,
          maxScore: response.data.maxScore,
          passed: response.data.passed,
        });
      } else {
        alert(response.error || "Có lỗi xảy ra khi nộp bài.");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-[800px] mx-auto flex flex-col gap-8">
      
      {/* Back button when inside quiz */}
      {quizStarted && !quizResult && (
        <button 
          onClick={() => setQuizStarted(false)}
          className="flex items-center gap-1 text-primary hover:underline text-xs font-semibold self-start select-none apple-active-scale"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Thoát bài kiểm tra
        </button>
      )}

      {/* 1. Quiz Listing view */}
      {!quizStarted && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display-lg text-3xl font-semibold text-ink">Thi & Khảo sát Trực tuyến</h1>
            <p className="font-caption text-ink-muted-80 mt-1">
              Danh sách đề kiểm tra trắc nghiệm đang mở. Hãy chắc chắn đường truyền internet của bạn ổn định trước khi làm bài.
            </p>
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
              <Award className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
              <p className="font-body text-ink-muted-80">Hiện tại không có đề thi nào đang mở.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase w-max select-none">
                      Đang mở
                    </span>
                    <h3 className="font-body-strong text-lg font-semibold text-ink">
                      {quiz.title}
                    </h3>
                    <p className="font-caption text-ink-muted-80 text-xs max-w-[500px]">
                      {quiz.description}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-ink-muted-48 mt-2">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {quiz.duration} phút</span>
                      <span>•</span>
                      <span>Điểm đạt: {quiz.passingScore.toFixed(1)} / 10</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleStartQuiz(quiz)}
                    className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm whitespace-nowrap self-stretch md:self-auto"
                  >
                    Bắt đầu làm bài
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Quiz Player view */}
      {quizStarted && !quizResult && (
        <div className="flex flex-col gap-6">
          
          {/* Sticky Timer Info */}
          <div className="sticky top-[60px] z-30 frosted-glass border border-hairline rounded-md p-4 flex items-center justify-between shadow-sm">
            <h2 className="font-body-strong text-sm text-ink font-semibold">{selectedQuiz?.title}</h2>
            <div className="flex items-center gap-2 text-red-600 font-mono font-bold text-sm bg-red-50 px-3 py-1 rounded-sm">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Questions Stack */}
          <div className="flex flex-col gap-6 mt-4">
            {selectedQuiz?.questions.map((q, qIndex) => (
              <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
                <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
                  Câu {qIndex + 1}: {q.text}
                </h3>
                
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
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
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
              "Nộp bài kiểm tra"
            )}
          </button>
        </div>
      )}

      {/* 3. Quiz Result View */}
      {quizStarted && quizResult && (
        <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-product flex flex-col items-center text-center max-w-[500px] mx-auto mt-12">
          {quizResult.passed ? (
            <div className="h-16 w-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10" />
            </div>
          )}

          <h2 className="font-tagline text-2xl font-semibold text-ink mb-2">
            Kết quả bài thi trắc nghiệm
          </h2>
          <p className="font-caption text-ink-muted-80 text-xs mb-8 max-w-[400px]">
            {selectedQuiz?.title}
          </p>

          {/* Score Circle */}
          <div className="h-28 w-28 rounded-full border-4 border-divider-soft flex flex-col items-center justify-center mb-6">
            <span className="text-3xl font-bold text-ink">{quizResult.score.toFixed(1)}</span>
            <span className="text-[10px] text-ink-muted-48 uppercase font-semibold">Trên {quizResult.maxScore.toFixed(0)}</span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <span className={`text-sm font-bold uppercase tracking-wider ${
              quizResult.passed ? "text-green-600" : "text-red-600"
            }`}>
              {quizResult.passed ? "Đạt bài kiểm tra" : "Không đạt (Điểm liệt)"}
            </span>
            <p className="text-xs text-ink-muted-48 mt-1 max-w-[360px] leading-relaxed">
              Điểm số đã được hệ thống tự động ghi nhận vào Sổ điểm cá nhân và liên kết báo cáo phụ huynh của bạn.
            </p>
          </div>

          <button
            onClick={() => setQuizStarted(false)}
            className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-8"
          >
            Quay lại trang đề thi
          </button>
        </div>
      )}

    </div>
  );
}
