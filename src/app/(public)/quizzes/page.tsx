"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Clock, Award, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Play, Lock } from "lucide-react";
import Link from "next/link";
import MathRenderer from "@/components/MathRenderer";

interface QuizMeta {
  id: string;
  title: string;
  category: string;
  duration: number;
  questionsCount: number;
  testCount: number;
  level: string;
  /** true = khách có thể thử ngay (mở demo inline), false = cần tài khoản VIP */
  isDemo: boolean;
}

export default function PublicQuizzesPage() {
  const [activeTab, setActiveTab] = useState<"list" | "demo">("list");
  
  // Demo Quiz State
  const [demoStarted, setDemoStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [demoResult, setDemoResult] = useState<{ score: number; passed: boolean } | null>(null);

  // demo-only
  // client-side
  const demoQuestions = [
    {
      text: "Cho phương trình x^2 - 7x + 12 = 0. Tập nghiệm S của phương trình là?",
      options: ["S = {3, 4}", "S = {2, 5}", "S = {-3, -4}", "S = {1, 6}"],
      correct: 0,
      explanations: "Áp dụng định lý Vi-ét: Tổng hai nghiệm S = 7, Tích hai nghiệm P = 12. Vậy hai nghiệm là 3 và 4.",
    },
    {
      text: "Đồ thị hàm số y = ax^2 (a != 0) là đường cong Parabol đi qua gốc tọa độ O. Parabol này có trục đối xứng là?",
      options: ["Trục hoành Ox", "Đường thẳng y = x", "Trục tung Oy", "Đường thẳng y = -x"],
      correct: 2,
      explanations: "Đồ thị hàm số y = ax^2 nhận trục tung Oy (phương trình x = 0) làm trục đối xứng.",
    },
    {
      text: "Cho biểu thức A = sin^2(x) + cos^2(x). Giá trị của A với mọi góc x là?",
      options: ["A = 0", "A = 1", "A = 2", "A = -1"],
      correct: 1,
      explanations: "Đây là công thức lượng giác cơ bản sin^2(x) + cos^2(x) = 1 với mọi x.",
    },
  ];

  const publicQuizzes: QuizMeta[] = [
    {
      id: "q1",
      title: "Đề thi thử THPT Quốc Gia 2027 - Môn Toán (Đề số 1)",
      category: "Thi thử THPT",
      duration: 90,
      questionsCount: 50,
      testCount: 1420,
      level: "Lớp 12",
      isDemo: true,   // Admin cho phép khách thử
    },
    {
      id: "q2",
      title: "Khảo sát Chuyên đề Điện xoay chiều nâng cao - Môn Vật lý",
      category: "Khảo sát Chuyên đề",
      duration: 50,
      questionsCount: 40,
      testCount: 856,
      level: "Lớp 12",
      isDemo: true,   // Admin cho phép khách thử
    },
    {
      id: "q3",
      title: "Đề ôn tập giữa học kỳ 1 - Toán học nâng cao 11",
      category: "Luyện thi Học kỳ",
      duration: 45,
      questionsCount: 25,
      testCount: 512,
      level: "Lớp 11",
      isDemo: false,  // Chỉ học viên VIP
    },
    {
      id: "q4",
      title: "Chống sai ngu lý thuyết Hóa học hữu cơ (Đề VIP)",
      category: "Chống sai ngu",
      duration: 30,
      questionsCount: 30,
      testCount: 2108,
      level: "Lớp 12",
      isDemo: false,  // Chỉ học viên VIP
    },
  ];

  const handleStartDemo = () => {
    setDemoStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setDemoResult(null);
  };

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion]: optIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < demoQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitDemo = () => {
    let score = 0;
    demoQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        score += 1;
      }
    });
    setDemoResult({
      score,
      passed: score >= 2,
    });
  };

  return (
    <div className="bg-canvas-parchment min-h-screen py-16 px-6">
      <div className="max-w-[980px] mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-4 items-center">
          <span className="text-xs text-primary font-semibold uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Luyện Đề Online
          </span>
          <h1 className="font-display-lg text-4xl font-semibold text-ink tracking-tight">
            Hệ Thống Thi & Luyện Đề Thực Chiến
          </h1>
          <p className="font-lead text-ink-muted-80 text-sm max-w-[620px] leading-relaxed mt-1">
            Đánh giá năng lực tức thì, rèn luyện phản xạ phòng thi thông qua hệ thống đề thi sát cấu trúc thực tế của Thầy Hùng Cường.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-row items-center justify-center border-b border-divider-soft w-full max-w-md mx-auto gap-1">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3 text-center text-[11px] sm:text-xs font-bold border-b-2 transition-all whitespace-nowrap px-2 ${
              activeTab === "list"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted-80 hover:text-ink"
            }`}
          >
            Danh sách đề thi thử ({publicQuizzes.length})
          </button>
          <button
            onClick={() => setActiveTab("demo")}
            className={`flex-1 py-3 text-center text-[11px] sm:text-xs font-bold border-b-2 transition-all whitespace-nowrap px-2 ${
              activeTab === "demo"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted-80 hover:text-ink"
            }`}
          >
            Luyện đề Demo nhanh
          </button>
        </div>

        {/* List Tab */}
        {activeTab === "list" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publicQuizzes.map((quiz) => (
                <div key={quiz.id} className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-primary px-2.5 py-0.5 rounded-full">
                        {quiz.category}
                      </span>
                      <span className="text-xs text-ink-muted-48 font-semibold">{quiz.level}</span>
                    </div>
                    <h3 className="font-body-strong text-base font-bold text-ink hover:text-primary transition-colors cursor-pointer">
                      {quiz.title}
                    </h3>
                    <div className="flex gap-4 items-center text-xs text-ink-muted-80 mt-2 font-body">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-ink-muted-48" />
                        <span>{quiz.duration} phút</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-ink-muted-48" />
                        <span>{quiz.questionsCount} câu hỏi</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-ink-muted-48" />
                        <span>{quiz.testCount} lượt thi</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-divider-soft pt-4 flex items-center justify-between">
                    {quiz.isDemo ? (
                      <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold uppercase">Thử miễn phí</span>
                    ) : (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold uppercase flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> VIP</span>
                    )}
                    {quiz.isDemo ? (
                      <button
                        onClick={() => setActiveTab("demo")}
                        className="bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-semibold apple-active-scale transition-colors shadow-sm flex items-center gap-1"
                      >
                        Thử ngay <Play className="h-3 w-3 fill-current" />
                      </button>
                    ) : (
                      <Link
                        href="/admission"
                        className="border border-primary text-primary hover:bg-blue-50 px-4 py-2 rounded-pill text-xs font-semibold apple-active-scale transition-colors flex items-center gap-1"
                      >
                        Đăng ký VIP <Lock className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Note block */}
            <div className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex gap-4 items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h4 className="font-body-strong text-xs font-semibold text-ink">Đề có nhãn &quot;Thử miễn phí&quot; — dành cho khách</h4>
                <p className="text-[11px] text-ink-muted-80 leading-relaxed font-body">
                  Các đề được admin đánh dấu <strong>Thử miễn phí</strong> có thể làm ngay không cần tài khoản. Kết quả thi chính thức và xếp hạng tuần chỉ được ghi nhận khi bạn có tài khoản học viên. Tài khoản được cấp sau khi <Link href="/admission" className="text-primary underline">đăng ký tư vấn lộ trình</Link>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Tab */}
        {activeTab === "demo" && (
          <div className="bg-canvas border border-hairline rounded-lg p-8 shadow-sm flex flex-col gap-6 animate-fade-in max-w-[650px] mx-auto w-full">
            {!demoStarted ? (
              <div className="text-center py-10 flex flex-col items-center gap-6">
                <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-tagline text-xl font-bold text-ink">Đề thi thử Demo nhanh môn Toán</h3>
                  <p className="text-xs text-ink-muted-80 mt-2 max-w-[400px] leading-relaxed mx-auto font-body">
                    Trải nghiệm trực tiếp tính năng làm đề online. Đề thi gồm 3 câu hỏi trắc nghiệm lượng giác và hình học cơ bản. Kết quả sẽ được hiển thị ngay khi nộp bài.
                  </p>
                </div>
                <button
                  onClick={handleStartDemo}
                  className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                >
                  Bắt đầu làm bài Demo
                </button>
              </div>
            ) : demoResult ? (
              /* Success results client screen */
              <div className="flex flex-col gap-6 py-4 animate-fade-in">
                <div className="text-center flex flex-col gap-3 items-center">
                  <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="font-tagline text-lg font-bold text-ink">Hoàn thành bài thi thử Demo!</h3>
                  <p className="text-xs text-ink-muted-80 font-body">
                    Điểm số đạt được: <strong className="text-primary text-sm">{demoResult.score} / {demoQuestions.length} câu đúng</strong>.
                  </p>
                </div>

                <div className="flex flex-col gap-4 border-t border-b border-divider-soft py-4 my-2">
                  <h4 className="font-body-strong text-xs font-semibold text-ink">Chi tiết đáp án & Lời giải:</h4>
                  {demoQuestions.map((q, idx) => {
                    const selected = selectedAnswers[idx];
                    const isCorrect = selected === q.correct;
                    return (
                      <div key={idx} className="bg-surface-pearl border border-divider-soft rounded p-4 flex flex-col gap-2 text-xs">
                        <p className="font-semibold text-ink">Câu {idx + 1}: <MathRenderer text={q.text} /></p>
                        <div className="flex flex-col gap-1 mt-1">
                          {q.options.map((opt, oIdx) => (
                            <div 
                              key={oIdx} 
                              className={`flex items-center gap-2 p-1.5 rounded ${
                                oIdx === q.correct 
                                  ? "bg-green-50 text-green-700 font-semibold" 
                                  : oIdx === selected && !isCorrect 
                                    ? "bg-red-50 text-red-700" 
                                    : ""
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full border border-divider-soft flex items-center justify-center text-[10px]">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <MathRenderer text={opt} />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-primary-focus bg-blue-50/50 p-2 rounded mt-2 font-body leading-relaxed">
                          💡 <strong>Lời giải:</strong> <MathRenderer text={q.explanations} />
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-4 text-center mt-4">
                  <p className="text-[11px] text-ink-muted-80 font-body leading-relaxed max-w-[450px] mx-auto">
                    * Lưu ý: Đáp án và câu hỏi của đề thi demo được biên dịch trực tiếp trên trình duyệt của bạn. Các đề thi thử chính thức trong cổng học viên sẽ được tải bảo mật từ máy chủ của trung tâm.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleStartDemo}
                      className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2.5 rounded-pill font-semibold transition-colors"
                    >
                      Làm lại đề
                    </button>
                    <Link
                      href="/admission"
                      className="bg-primary hover:bg-primary-focus text-white px-5 py-2.5 rounded-pill font-body font-semibold text-xs transition-colors shadow-sm"
                    >
                      Đăng ký học khóa VIP để làm full đề
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Doing Exam Screen */
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-divider-soft pb-4 text-xs font-semibold text-ink-muted-80">
                  <span>Câu hỏi {currentQuestion + 1} / {demoQuestions.length}</span>
                  <span className="text-primary">Đề thi thử Demo Môn Toán</span>
                </div>

                <div className="min-h-[100px] py-4">
                  <p className="text-sm font-semibold text-ink leading-relaxed">
                    <MathRenderer text={demoQuestions[currentQuestion].text} />
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {demoQuestions[currentQuestion].options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[currentQuestion] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(oIdx)}
                        className={`w-full text-left p-3.5 rounded-pill border text-xs transition-all flex items-center gap-3 ${
                          isSelected 
                            ? "border-primary bg-blue-50/50 text-primary font-semibold shadow-sm" 
                            : "border-divider-soft bg-canvas text-ink hover:bg-surface-pearl"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected ? "border-primary bg-primary text-white" : "border-divider-soft"
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <MathRenderer text={opt} />
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-divider-soft pt-6 mt-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentQuestion === 0}
                    className="border border-divider-soft hover:bg-surface-pearl text-ink-muted-80 text-xs px-4 py-2 rounded-pill font-semibold transition-all disabled:opacity-30"
                  >
                    Câu trước
                  </button>

                  {currentQuestion < demoQuestions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={selectedAnswers[currentQuestion] === undefined}
                      className="bg-primary hover:bg-primary-focus text-white text-xs px-4 py-2 rounded-pill font-semibold transition-all disabled:opacity-50"
                    >
                      Câu tiếp theo
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitDemo}
                      disabled={Object.keys(selectedAnswers).length < demoQuestions.length}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-5 py-2 rounded-pill font-semibold transition-all disabled:opacity-50"
                    >
                      Nộp bài ngay
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
