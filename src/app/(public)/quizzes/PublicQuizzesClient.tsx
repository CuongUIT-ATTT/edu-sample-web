"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Clock, Award, CheckCircle2, AlertCircle, RefreshCw, Play, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import MathRenderer from "@/components/MathRenderer";
import { submitQuiz } from "@/actions/quizzes";

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
  score: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  passingScore: number;
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
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempSelectedQuiz, setTempSelectedQuiz] = useState<Quiz | null>(null);
  
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    passed: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleOpenNamePrompt = (quiz: Quiz) => {
    setTempSelectedQuiz(quiz);
    setShowNameModal(true);
  };

  const handleStartQuiz = () => {
    if (!guestName.trim()) {
      alert("Vui lòng nhập Họ tên để bắt đầu làm bài thi thử.");
      return;
    }
    if (!tempSelectedQuiz) return;
    
    setSelectedQuiz(tempSelectedQuiz);
    setTimeLeft(tempSelectedQuiz.duration * 60);
    setAnswers({});
    setQuizResult(null);
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
    if (!selectedQuiz) return;
    setSubmitting(true);

    try {
      const response = await submitQuiz({
        quizId: selectedQuiz.id,
        answers,
        guestName,
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

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-10">
        
        {/* Back button when inside quiz */}
        {quizStarted && !quizResult && (
          <button 
            onClick={() => setQuizStarted(false)}
            className="flex items-center gap-1 text-primary hover:underline text-xs font-semibold self-start select-none apple-active-scale"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Thoát làm đề
          </button>
        )}

        {/* 1. Quiz Listing tab */}
        {!quizStarted && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="text-center flex flex-col gap-4 items-center">
              <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Luyện Đề Công Khai
              </span>
              <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
                Đề Thi Thử Thực Chiến Công Khai
              </h1>
              <p className="font-lead text-ink-muted-80 text-sm max-w-[620px] leading-relaxed mt-1">
                Làm đề trắc nghiệm trực tuyến hoàn toàn miễn phí. Chỉ cần điền Họ tên là có thể thử sức ngay, không cần đăng nhập tài khoản.
              </p>
            </div>

            {/* Search and List */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
              <span className="text-sm font-semibold text-ink">
                Danh sách đề thi công khai ({filteredQuizzes.length})
              </span>
              <input
                type="text"
                placeholder="Tìm đề thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-canvas border border-hairline rounded-pill px-4 py-2 h-10 text-xs text-ink outline-none focus:border-primary-focus w-full md:w-72"
              />
            </div>

            {filteredQuizzes.length === 0 ? (
              <div className="bg-canvas border border-hairline rounded-lg p-16 text-center shadow-sm">
                <Award className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
                <p className="font-body text-ink-muted-80">Hiện tại chưa có đề thi công khai nào hoạt động.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                          {quiz.category}
                        </span>
                        <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold uppercase">Miễn phí</span>
                      </div>
                      <h3 className="font-body-strong text-base font-bold text-ink">
                        {quiz.title}
                      </h3>
                      <p className="font-caption text-ink-muted-80 text-xs leading-relaxed line-clamp-2">
                        {quiz.description || "Đề ôn thi thử chất lượng cao bám sát chương trình mới kèm lời giải chi tiết."}
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
                      onClick={() => handleOpenNamePrompt(quiz)}
                      className="bg-primary hover:bg-primary-focus text-white px-4 py-2.5 rounded-pill font-body-strong text-xs text-center apple-active-scale transition-colors shadow-sm w-full mt-2 flex items-center justify-center gap-1.5"
                    >
                      Bắt đầu thi thử <Play className="h-3 w-3 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Note block */}
            <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex gap-4 items-start mt-6">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h4 className="font-body-strong text-xs font-semibold text-ink">Lưu ý khi làm đề thi Công khai</h4>
                <p className="text-[11px] text-ink-muted-80 leading-relaxed font-body">
                  Để ghi nhận bảng điểm chi tiết, lịch sử làm bài và xếp hạng học viên trung tâm, bạn cần đăng nhập tài khoản học viên chính thức. Bạn có thể liên hệ đăng ký khoá học VIP tại trang <Link href="/admission" className="text-primary underline">Đăng ký tuyển sinh</Link>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Interactive Quiz Player view */}
        {quizStarted && !quizResult && selectedQuiz && (
          <div className="flex flex-col gap-6 max-w-[800px] mx-auto w-full">
            {/* Sticky Timer Info */}
            <div className="sticky top-[60px] z-30 frosted-glass border border-hairline rounded-md p-4 flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-0.5">
                <h2 className="font-body-strong text-sm text-ink font-semibold">{selectedQuiz.title}</h2>
                <span className="text-[10px] text-ink-muted-48">Thí sinh tự do: {guestName}</span>
              </div>
              <div className="flex items-center gap-2 text-red-600 font-mono font-bold text-sm bg-red-50 px-3 py-1 rounded-sm">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Questions Stack */}
            <div className="flex flex-col gap-6 mt-4">
              {selectedQuiz.questions.map((q, qIndex) => (
                <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 flex flex-col gap-4">
                  <h3 className="font-body-strong text-sm text-ink font-semibold leading-relaxed">
                    Câu {qIndex + 1}: <MathRenderer text={q.text} />
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
                "Nộp bài thi tự do"
              )}
            </button>
          </div>
        )}

        {/* 3. Quiz Result View */}
        {quizStarted && quizResult && selectedQuiz && (
          <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm flex flex-col items-center text-center max-w-[650px] mx-auto w-full">
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
              {selectedQuiz.title}
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

            <button
              onClick={() => {
                setQuizStarted(false);
                setSelectedQuiz(null);
                setQuizResult(null);
              }}
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-4"
            >
              Quay lại danh sách đề thi
            </button>
          </div>
        )}

      </div>

      {/* Guest Name Modal */}
      {showNameModal && tempSelectedQuiz && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[400px] max-w-full shadow-product flex flex-col overflow-hidden animate-fade-in p-6">
            <h3 className="font-tagline text-base font-semibold text-ink mb-2">Nhập Họ Tên Thí Sinh</h3>
            <p className="text-xs text-ink-muted-80 mb-4">
              Vui lòng cung cấp Họ tên để lưu thông tin bài thi thử công khai cho đề: <strong>{tempSelectedQuiz.title}</strong>
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
