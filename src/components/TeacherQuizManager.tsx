"use client";

import React, { useState } from "react";
import { BookOpen, Clock, Award, Plus, Trash2, X, PlusCircle, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { createQuiz, deleteQuiz } from "@/actions/quizzes";

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  passingScore: number;
  subject: {
    id: string;
    name: string;
  };
  _count: {
    questions: number;
  };
}

interface TeacherQuizManagerProps {
  quizzes: QuizItem[];
  subjects: { id: string; name: string }[];
}

export default function TeacherQuizManager({ quizzes, subjects }: TeacherQuizManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [passingScore, setPassingScore] = useState(5);
  const [subjectId, setSubjectId] = useState("");
  
  // Questions array state
  const [questions, setQuestions] = useState<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    score: number;
  }[]>([
    { questionText: "", options: ["", "", "", ""], correctAnswer: "0", score: 1 }
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctAnswer: "0", score: 1 }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, val: string) => {
    const next = [...questions];
    next[idx].questionText = val;
    setQuestions(next);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const next = [...questions];
    next[qIdx].options[optIdx] = val;
    setQuestions(next);
  };

  const handleCorrectAnswerChange = (qIdx: number, val: string) => {
    const next = [...questions];
    next[qIdx].correctAnswer = val;
    setQuestions(next);
  };

  const handleScoreChange = (qIdx: number, val: number) => {
    const next = [...questions];
    next[qIdx].score = val;
    setQuestions(next);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá đề thi ${name}?`)) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await deleteQuiz(id);
    if (res.success) {
      setSuccessMsg(res.message || "Xoá đề thi thành công.");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Xoá đề thi thất bại.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validate
    if (questions.some(q => q.questionText.trim() === "" || q.options.some(opt => opt.trim() === ""))) {
      setErrorMsg("Vui lòng điền đầy đủ câu hỏi và tất cả các phương án trắc nghiệm.");
      return;
    }

    const res = await createQuiz({
      title,
      description,
      duration: Number(duration),
      passingScore: Number(passingScore),
      subjectId,
      questions,
    });

    if (res.success) {
      setSuccessMsg("Tạo đề kiểm tra trắc nghiệm thành công!");
      setIsCreateOpen(false);
      // Reset
      setTitle("");
      setDescription("");
      setDuration(15);
      setPassingScore(5);
      setSubjectId("");
      setQuestions([{ questionText: "", options: ["", "", "", ""], correctAnswer: "0", score: 1 }]);
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Tạo đề thất bại.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Alert status */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex justify-between items-center bg-canvas border border-hairline rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-ink">Danh sách các bài test bạn quản lý</span>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tạo đề thi trắc nghiệm mới
        </button>
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.length === 0 ? (
          <div className="col-span-2 bg-canvas border border-hairline p-16 text-center rounded-lg">
            <Award className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">Bạn chưa tạo bài test/đề thi nào.</p>
          </div>
        ) : (
          quizzes.map((q) => (
            <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-primary px-2.5 py-0.5 rounded-full">
                    {q.subject.name}
                  </span>
                  <span className="text-xs text-ink-muted-48 font-semibold">{q._count.questions} câu hỏi</span>
                </div>
                <h3 className="font-body-strong text-base font-bold text-ink leading-snug">
                  {q.title}
                </h3>
                {q.description && (
                  <p className="text-xs text-ink-muted-80 font-body line-clamp-2">{q.description}</p>
                )}
                
                <div className="flex gap-4 items-center text-xs text-ink-muted-80 mt-2 font-body">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {q.duration} phút
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Đạt: {q.passingScore} điểm
                  </span>
                </div>
              </div>

              <div className="border-t border-divider-soft pt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(q.id, q.title)}
                  className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xoá đề thi
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE QUIZ MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-full max-w-2xl shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                Tạo đề trắc nghiệm mới
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-ink-muted-48 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Tiêu đề bài kiểm tra</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Kiểm tra 15 phút - Chuyên đề Lượng giác"
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2 text-sm text-ink outline-none focus:border-primary-focus w-full"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Môn học</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                    required
                  >
                    <option value="">— Chọn môn —</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">Thời gian (phút)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-caption-strong text-ink-muted-80">Điểm đạt</label>
                    <input
                      type="number"
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="bg-canvas border border-hairline rounded-pill px-4 py-2 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full text-center"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Mô tả thêm (Không bắt buộc)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn gọn về đề thi"
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  />
                </div>
              </div>

              {/* Formula instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-[11px] text-ink-muted-80 font-body leading-relaxed flex flex-col gap-1">
                <span className="font-semibold text-ink block">💡 Hướng dẫn nhập công thức Toán học / Vật lý:</span>
                Nhập công thức trong cặp dấu $...$ để hiển thị công thức đẹp mắt.
                Ví dụ: <code className="bg-canvas px-1 py-0.5 rounded border border-hairline">$x^2 - 7x + 12 = 0$</code> hoặc <code className="bg-canvas px-1 py-0.5 rounded border border-hairline">$\sin^2(x) + \cos^2(x) = 1$</code>.
              </div>

              {/* Questions Area */}
              <div className="border-t border-divider-soft pt-4 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-caption-strong text-ink uppercase tracking-wider">Danh sách câu hỏi trắc nghiệm</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" /> Thêm câu hỏi
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="border border-hairline rounded-lg p-5 flex flex-col gap-4 bg-surface-pearl relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="absolute top-2 right-2 text-ink-muted-48 hover:text-red-500"
                      title="Xoá câu hỏi này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex flex-col gap-1.5 pr-8">
                      <label className="text-xs font-semibold text-ink">Câu hỏi {qIdx + 1}</label>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        placeholder="Nhập nội dung câu hỏi (chấp nhận công thức $...$)"
                        className="bg-canvas border border-hairline rounded-pill px-4 py-2 text-sm text-ink outline-none focus:border-primary-focus w-full"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-ink-muted-80">Phương án {String.fromCharCode(65 + optIdx)}</label>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}`}
                            className="bg-canvas border border-hairline rounded-pill px-4.5 py-1.5 text-xs text-ink outline-none focus:border-primary-focus w-full"
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-ink-muted-80">Đáp án đúng</label>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) => handleCorrectAnswerChange(qIdx, e.target.value)}
                          className="bg-canvas border border-hairline rounded-pill px-3 py-1 text-xs outline-none w-full"
                        >
                          <option value="0">Phương án A</option>
                          <option value="1">Phương án B</option>
                          <option value="2">Phương án C</option>
                          <option value="3">Phương án D</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-ink-muted-80">Điểm số</label>
                        <input
                          type="number"
                          step="0.5"
                          value={q.score}
                          onChange={(e) => handleScoreChange(qIdx, Number(e.target.value))}
                          className="bg-canvas border border-hairline rounded-pill px-3 py-1 text-xs outline-none w-full text-center"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="bg-primary hover:bg-primary-focus text-white px-6 py-3 rounded-pill font-body font-semibold w-full mt-4 text-sm shadow-sm"
              >
                Xác nhận tạo đề thi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
