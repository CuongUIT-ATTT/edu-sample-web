"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckSquare, Award, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Search, Trophy, BarChart3 } from "lucide-react";
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

  async function handleSubmit() {
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
        <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
          
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
              "Nộp bài thi luyện đề"
            )}
          </button>
        </div>
      )}

      {/* 3. Quiz Result View (highly customized like tyhh.net) */}
      {quizStarted && quizResult && (
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

            <button
              onClick={() => setQuizStarted(false)}
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold apple-active-scale transition-colors shadow-sm w-full mt-8"
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

    </div>
  );
}
