"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, CheckSquare, Award, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Search, Trophy, BarChart3 } from "lucide-react";
import { submitQuiz } from "@/actions/quizzes";
import MathRenderer from "@/components/MathRenderer";

interface Question {
  id: string;
  text: string;
  type?: string;
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
    correctAnswers?: { id: string; correctAnswer: string; explanation: string | null }[] | null;
  } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [isCheatedLocked, setIsCheatedLocked] = useState(false);
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
          alert("BÀI THI BỊ KHÓA: Bạn đã rời màn hình/chuyển tab quá 3 lần. Bài thi sẽ tự động được nộp.");
          if (forceSubmitRef.current) {
            forceSubmitRef.current();
          }
          return next;
        } else {
          alert(`CẢNH BÁO GIAN LẬN: Bạn không được rời màn hình làm bài! Lần vi phạm: ${next}/3. Quá 3 lần bài thi sẽ tự động khóa và nộp bài.`);
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

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setTimeLeft(quiz.duration * 60);
    setAnswers({});
    setQuizResult(null);
    setShowReview(false);
    setQuizStarted(true);
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

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.description && q.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-8">
      
      {/* Back button when inside quiz */}
      {quizStarted && !quizResult && (
        <button 
          onClick={() => setQuizStarted(false)}
          className="flex items-center gap-1 text-primary hover:underline text-xs font-semibold self-start select-none apple-active-scale"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Thoát luyện đề
        </button>
      )}

      {/* 1. Quiz Listing view */}
      {!quizStarted && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display-lg text-3xl font-semibold text-ink">Kho Đề Thi Thử & Luyện Đề</h1>
              <p className="font-caption text-ink-muted-80 mt-1">
                Luyện đề thi thử THPT Quốc gia, thi thử Học kỳ và Chuyên đề bám sát cấu trúc mới nhất.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-muted-48" />
              <input
                type="text"
                placeholder="Tìm đề thi, chuyên đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-canvas border border-hairline rounded-pill pl-10 pr-4 py-2 h-10 text-xs text-ink outline-none focus:border-primary-focus w-full"
              />
            </div>
          </div>

          {filteredQuizzes.length === 0 ? (
            <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
              <Award className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
              <p className="font-body text-ink-muted-80">Không tìm thấy đề thi phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredQuizzes.map((quiz) => {
                // Mock statistical metrics in tyhh.net style
                const mockRuns = Math.floor(quiz.title.charCodeAt(0) * 12) + 240;
                return (
                  <div key={quiz.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col justify-between gap-4 hover:border-primary transition-all duration-200 shadow-sm">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase select-none">
                          VIP Đề Thi
                        </span>
                        <span className="text-[10px] text-ink-muted-48">{mockRuns} lượt làm</span>
                      </div>
                      <h3 className="font-body-strong text-base font-semibold text-ink mt-1">
                        {quiz.title}
                      </h3>
                      <p className="font-caption text-ink-muted-80 text-xs leading-relaxed line-clamp-2">
                        {quiz.description || "Đề ôn thi chất lượng cao đi kèm đáp án giải chi tiết từng phần."}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-ink-muted-48 mt-1 border-t border-divider-soft pt-3">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {quiz.duration} phút</span>
                        <span>•</span>
                        <span>{quiz.questions.length} câu hỏi</span>
                        <span>•</span>
                        <span>Điểm đạt: {quiz.passingScore.toFixed(1)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleStartQuiz(quiz)}
                      className="bg-primary hover:bg-primary-focus text-white px-4 py-2.5 rounded-pill font-body-strong text-xs text-center apple-active-scale transition-colors shadow-sm w-full mt-2"
                    >
                      Bắt đầu làm bài thi
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Quiz Player view */}
      {quizStarted && !quizResult && (
        <div 
          className="flex flex-col gap-6 max-w-[800px] mx-auto select-none relative"
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Floating Watermark for Anti-Screen Recording */}
          <div className="pointer-events-none fixed inset-0 z-20 flex flex-wrap gap-12 justify-center items-center overflow-hidden opacity-[0.02] select-none">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="text-ink font-bold text-xs transform -rotate-12 whitespace-nowrap">
                Học sinh - Đang làm bài - CẤM QUAY MÀN HÌNH / SAO CHÉP
              </div>
            ))}
          </div>

          {/* Sticky Timer Info */}
          <div className="sticky top-[60px] z-30 frosted-glass border border-hairline rounded-md p-4 flex items-center justify-between shadow-sm">
            <h2 className="font-body-strong text-sm text-ink font-semibold">{selectedQuiz?.title}</h2>
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
            {selectedQuiz?.questions.map((q, qIndex) => (
              <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
                <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
                  Câu {qIndex + 1}: <MathRenderer text={q.text} />
                </h3>
                
                {q.type === "TRUE_FALSE" ? (
                  // Section II: True/False statements
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
                  // Section III: Short Answer textbox
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-caption-strong text-ink-muted-80">Nhập đáp số (Số thập phân hoặc số nguyên):</label>
                    <input
                      type="text"
                      value={answers[q.id] || ""}
                      onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                      placeholder="Ví dụ: -1.5 hoặc 15..."
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-xs text-ink outline-none focus:border-primary-focus w-48"
                    />
                  </div>
                ) : (
                  // Section I: Multiple Choice
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
              "Nộp bài thi luyện đề"
            )}
          </button>
        </div>
      )}

      {/* 3. Quiz Result View (highly customized like tyhh.net) */}
      {quizStarted && quizResult && !showReview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* Result analytics card */}
          <div className="lg:col-span-2 bg-canvas border border-hairline rounded-lg p-8 shadow-sm flex flex-col items-center text-center">
            {quizResult.passed ? (
              <div className="h-14 w-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8" />
              </div>
            )}

            <h2 className="font-tagline text-xl font-semibold text-ink mb-1">
              Điểm thi của bạn
            </h2>
            <p className="font-caption text-ink-muted-80 text-xs mb-6 max-w-[400px]">
              {selectedQuiz?.title}
            </p>

            <div className="h-24 w-24 rounded-full border-4 border-divider-soft flex flex-col items-center justify-center mb-6 bg-surface-pearl">
              <span className="text-2xl font-bold text-ink">{quizResult.score.toFixed(1)}</span>
              <span className="text-[9px] text-ink-muted-48 uppercase font-bold">Thang 10</span>
            </div>

            <div className="flex flex-col gap-2 w-full border-t border-divider-soft pt-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                quizResult.passed ? "text-green-600" : "text-red-600"
              }`}>
                {quizResult.passed ? "Đạt bài kiểm tra năng lực" : "Chưa đạt mục tiêu tối thiểu"}
              </span>
              
              {/* Point breakdown per sections (tyhh.net style) */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-left max-w-sm mx-auto w-full">
                <div className="flex justify-between border-b border-divider-soft pb-1.5">
                  <span className="text-ink-muted-80">Phần Lý Thuyết:</span>
                  <span className="font-bold text-ink">{(quizResult.score * 0.6).toFixed(1)} đ</span>
                </div>
                <div className="flex justify-between border-b border-divider-soft pb-1.5">
                  <span className="text-ink-muted-80">Phần Vận Dụng:</span>
                  <span className="font-bold text-ink">{(quizResult.score * 0.4).toFixed(1)} đ</span>
                </div>
              </div>
            </div>

            {quizResult.correctAnswers && (
              <button
                onClick={() => setShowReview(true)}
                className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-6"
              >
                Xem đáp án & lời giải chi tiết
              </button>
            )}

            <button
              onClick={() => setQuizStarted(false)}
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4"
            >
              Quay lại danh sách đề thi
            </button>
          </div>

          {/* Ranking & Statistics panel like tyhh.net */}
          <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h3 className="font-body-strong text-sm font-bold text-ink flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" />
                Phân tích học lực trung tâm
              </h3>
              <p className="text-[10px] text-ink-muted-48 mt-0.5">Tỷ lệ điểm số của các học viên đã thi</p>
            </div>

            {/* Rank proportions */}
            <div className="flex flex-col gap-3">
              {[
                { label: "Xuất sắc (9.0 - 10)", percentage: 12.5, count: "48 em", color: "bg-red-500" },
                { label: "Giỏi (7.5 - 8.9)", percentage: 34.2, count: "132 em", color: "bg-green-500" },
                { label: "Khá (5.0 - 7.4)", percentage: 41.8, count: "161 em", color: "bg-blue-500" },
                { label: "Trung bình (< 5.0)", percentage: 11.5, count: "44 em", color: "bg-gray-400" },
              ].map((r, i) => (
                <div key={i} className="flex flex-col gap-1 text-[11px] font-caption">
                  <div className="flex justify-between text-ink-muted-80">
                    <span>{r.label}</span>
                    <span className="font-bold">{r.percentage}% ({r.count})</span>
                  </div>
                  <div className="h-2 w-full bg-divider-soft rounded-full overflow-hidden">
                    <div className={`h-full ${r.color}`} style={{ width: `${r.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard panel mock */}
            <div className="border-t border-divider-soft pt-4 flex flex-col gap-3">
              <h4 className="text-xs font-caption-strong text-ink flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Top 3 thủ khoa bài thi
              </h4>
              <div className="flex flex-col gap-2 font-caption text-xs">
                <div className="flex justify-between items-center bg-yellow-50 border border-yellow-100 p-2 rounded">
                  <span className="font-semibold text-yellow-800">🥇 1. Trần Hữu Cương</span>
                  <span className="font-bold text-yellow-800">10.0 đ</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 border border-gray-100 p-2 rounded">
                  <span className="font-semibold text-gray-700">🥈 2. Nguyễn Văn An</span>
                  <span className="font-bold text-gray-700">9.5 đ</span>
                </div>
                <div className="flex justify-between items-center bg-orange-50 border border-orange-100 p-2 rounded">
                  <span className="font-semibold text-orange-700">🥉 3. Lê Thị Hoa</span>
                  <span className="font-bold text-orange-700">9.0 đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quiz Review Mode */}
      {quizStarted && quizResult && selectedQuiz && showReview && quizResult.correctAnswers && (
        <div className="flex flex-col gap-6 max-w-[800px] mx-auto w-full animate-fade-in">
          <div className="flex justify-between items-center border-b border-divider pb-4 bg-canvas border border-hairline rounded-lg p-4 shadow-sm">
            <div>
              <h3 className="font-tagline text-base font-bold text-ink">Chi tiết đáp án & lời giải đề thi</h3>
              <p className="text-[10px] text-ink-muted-48">{selectedQuiz.title}</p>
            </div>
            <button
              onClick={() => setShowReview(false)}
              className="bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-semibold"
            >
              Quay lại bảng điểm
            </button>
          </div>

          <div className="flex flex-col gap-6 mt-4">
            {selectedQuiz.questions.map((q, qIndex) => {
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
                <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
                      Câu {qIndex + 1}: <MathRenderer text={q.text} />
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

    </div>
  );
}
