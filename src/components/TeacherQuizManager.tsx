/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useMemo } from "react";
import { BookOpen, Clock, Award, Plus, Trash2, X, PlusCircle, CheckCircle, AlertCircle, HelpCircle, FileText, Upload, Share2, Edit3, Loader2, UserCheck, BarChart2, ImagePlus, Image as ImageIcon, Scissors, Sparkles, Search } from "lucide-react";
import { createQuiz, deleteQuiz, updateQuiz, getQuizSubmissions } from "@/actions/quizzes";
import MathRenderer from "@/components/MathRenderer";
import { showToast } from "@/components/Toast";
import PDFRegionSelector from "@/components/PDFRegionSelector";
import { normalizeQuestions } from "@/lib/quiz-import";

interface QuizAssignmentItem {
  classId: string;
  deadlineOverride?: string | null;
  startsAtOverride?: string | null;
  class?: {
    id: string;
    name: string;
  } | null;
}

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  passingScore: number;
  deadline?: string | null;
  isPublic?: boolean;
  shuffleQuestions?: boolean;
  submissions?: { score: number }[];
  answerVisibility?: string;
  creatorName?: string;
  subject: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  } | null;
  assignments?: QuizAssignmentItem[];
  _count: {
    questions: number;
  };
  questions?: {
    id: string;
    text: string;
    type: string;
    options: any;
    correctAnswer: string;
    score: number;
    explanation?: string | null;
    imageUrl?: string | null;
  }[];
}

interface TeacherQuizManagerProps {
  quizzes: QuizItem[];
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  isAdmin?: boolean;
}

interface ClassTabItem {
  classId: string;
  className: string;
  studentCount: number;
  deadlineOverride?: string | null;
  startsAtOverride?: string | null;
}

export default function TeacherQuizManager({ quizzes, subjects, classes, isAdmin = false }: TeacherQuizManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const imageFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");

  const filteredQuizzes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      const matchesQuery =
        !q ||
        quiz.title.toLowerCase().includes(q) ||
        (quiz.description ?? "").toLowerCase().includes(q) ||
        (quiz.creatorName ?? "").toLowerCase().includes(q) ||
        quiz.subject.name.toLowerCase().includes(q);
      const matchesSubject = !subjectFilter || quiz.subject.id === subjectFilter;
      const matchesVisibility =
        !visibilityFilter ||
        (visibilityFilter === "PUBLIC" && quiz.isPublic) ||
        (visibilityFilter === "INTERNAL" && !quiz.isPublic);
      return matchesQuery && matchesSubject && matchesVisibility;
    });
  }, [quizzes, searchQuery, subjectFilter, visibilityFilter]);

  // Submissions modal state
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState("");
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [submissionsQuizInfo, setSubmissionsQuizInfo] = useState<any>(null);
  const [submissionsQuiz, setSubmissionsQuiz] = useState<QuizItem | null>(null);
  const [selectedClassTab, setSelectedClassTab] = useState<string>("ALL");
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Share modal state
  const [shareModalQuiz, setShareModalQuiz] = useState<QuizItem | null>(null);
  const [manualShareClassId, setManualShareClassId] = useState<string>("");

  const handleViewSubmissions = async (quiz: QuizItem) => {
    setSelectedQuizTitle(quiz.title);
    setSubmissionsQuiz(quiz);
    setIsSubmissionsOpen(true);
    setLoadingSubmissions(true);
    setSubmissionsList([]);
    setSubmissionsQuizInfo(null);
    setSelectedClassTab("ALL");

    try {
      const res = await getQuizSubmissions(quiz.id);
      if (res.success && res.data) {
        setSubmissionsList(res.data);
        setSubmissionsQuizInfo(res.quizInfo || null);
      } else {
        showToast(res.error || "Không thể tải danh sách kết quả.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi hệ thống khi tải kết quả.", "error");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [passingScore, setPassingScore] = useState(5);
  const [subjectId, setSubjectId] = useState("");
  const [assignments, setAssignments] = useState<QuizAssignmentItem[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [showOnList, setShowOnList] = useState(true);
  const [answerVisibility, setAnswerVisibility] = useState("IMMEDIATELY");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [deadline, setDeadline] = useState(""); // string cho <input type="datetime-local">
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  
  // Custom type toggle inside form
  const [importMethod, setImportMethod] = useState<"JSON" | "PDF">("JSON");
  const [jsonText, setJsonText] = useState("");
  const [imageJsonText, setImageJsonText] = useState("");
  const [importingImages, setImportingImages] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Questions array state supporting Section I, II, III
  const [questions, setQuestions] = useState<{
    questionText: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options: string[];
    correctAnswer: string;
    score: number;
    explanation?: string;
    imageUrl?: string;
  }[]>([
    { questionText: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: "0", score: 1, explanation: "", imageUrl: "" }
  ]);

  const handleAddQuestionByType = (type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") => {
    let options: string[] = [];
    let correctAnswer = "";
    let score = 1.0;

    if (type === "MULTIPLE_CHOICE") {
      options = ["", "", "", ""];
      correctAnswer = "0";
      score = 0.25;
    } else if (type === "TRUE_FALSE") {
      options = ["", "", "", ""];
      correctAnswer = "T,T,T,T";
      score = 1.0;
    } else if (type === "SHORT_ANSWER") {
      options = [];
      correctAnswer = "";
      score = 0.5;
    }

    setQuestions([...questions, { questionText: "", type, options, correctAnswer, score, explanation: "", imageUrl: "" }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleExplanationChange = (qIdx: number, val: string) => {
    const next = [...questions];
    next[qIdx].explanation = val;
    setQuestions(next);
  };

  const handleImageUrlChange = (qIdx: number, val: string) => {
    const next = [...questions];
    next[qIdx].imageUrl = val;
    setQuestions(next);
  };

  const handleQuestionTextChange = (idx: number, val: string) => {
    const next = [...questions];
    next[idx].questionText = val;
    setQuestions(next);
  };

  const handleTypeChange = (idx: number, type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") => {
    const next = [...questions];
    next[idx].type = type;
    if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
      next[idx].options = ["", "", "", ""];
      next[idx].correctAnswer = type === "MULTIPLE_CHOICE" ? "0" : "T,T,T,T";
    } else {
      next[idx].options = [];
      next[idx].correctAnswer = "";
    }
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

  const handleTrueFalseCorrectChange = (qIdx: number, optIdx: number, val: "T" | "F") => {
    const next = [...questions];
    const current = next[qIdx].correctAnswer || "T,T,T,T";
    const parts = current.split(",");
    parts[optIdx] = val;
    next[qIdx].correctAnswer = parts.join(",");
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

  const downloadJsonTemplate = () => {
    // Tiny 1x1 red pixel PNG — example of base64 image in imageUrl.
    // Users can paste any base64 data:image/... string here; the system auto-uploads it to Cloudinary.
    const exampleBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

    const template = [
      {
        questionText: "Nguyên hàm của hàm số $f(x)=x^2$ là?",
        type: "MULTIPLE_CHOICE",
        options: ["$\\frac{x^3}{3}+C$", "$2x+C$", "$x^3+C$", "$\\frac{x^2}{2}+C$"],
        correctAnswer: "0",
        score: 0.25,
        explanation: "Áp dụng công thức nguyên hàm cơ bản: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$ với $n=2$.",
        imageUrl: ""
      },
      {
        questionText: "Dựa vào hình vẽ, xác định diện tích hình chữ nhật ABCD có cạnh a = 5cm, b = 3cm.",
        type: "MULTIPLE_CHOICE",
        options: ["15 cm²", "16 cm²", "8 cm²", "10 cm²"],
        correctAnswer: "0",
        score: 0.25,
        explanation: "Diện tích hình chữ nhật = a × b = 5 × 3 = 15 cm².",
        imageUrl: exampleBase64
      },
      {
        questionText: "Đồ thị hàm số bậc hai $y = ax^2 + bx + c$ ($a \\neq 0$) là một đường Parabol.\n\n(a) Đồ thị cắt trục tung tại điểm $(0; c)$.\n(b) Trục đối xứng của Parabol là đường thẳng $x = -\\frac{b}{2a}$.\n(c) Tọa độ đỉnh của Parabol là $I(-\\frac{b}{2a}; -\\frac{\\Delta}{4a})$.\n(d) Parabol luôn quay bề lõm lên trên với mọi giá trị $a$.",
        type: "TRUE_FALSE",
        options: [
          "(a) Đồ thị cắt trục tung tại điểm $(0; c)$.",
          "(b) Trục đối xứng của Parabol là đường thẳng $x = -\\frac{b}{2a}$.",
          "(c) Tọa độ đỉnh của Parabol là $I(-\\frac{b}{2a}; -\\frac{\\Delta}{4a})$.",
          "(d) Parabol luôn quay bề lõm lên trên với mọi giá trị $a$."
        ],
        correctAnswer: "T,T,T,F",
        score: 1.0,
        explanation: "(a) Đúng — tại x=0, y=c. (b) Đúng — trục đối xứng của parabol. (c) Đúng — công thức tọa độ đỉnh. (d) Sai — bề lõm quay lên khi a>0, quay xuống khi a<0.",
        imageUrl: ""
      },
      {
        questionText: "Phương trình $\\log_2(x) = 3$ có nghiệm là bao nhiêu?",
        type: "SHORT_ANSWER",
        options: [],
        correctAnswer: "8",
        score: 0.5,
        explanation: "Ta có: $\\log_2(x) = 3 \\Leftrightarrow x = 2^3 = 8$.",
        imageUrl: ""
      }
    ];

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(template, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", "mau_de_thi_THPT_2026.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSkillFile = async () => {
    try {
      const response = await fetch("/docs/exam-to-quiz-json.md");
      if (!response.ok) throw new Error("Không tải được file hướng dẫn");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "exam-to-quiz-json.md");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      showToast("Không thể tải file hướng dẫn. Vui lòng thử lại.", "error");
    }
  };

  const handleMergeImages = async () => {
    if (!imageJsonText.trim()) {
      showToast("Vui lòng dán JSON ảnh base64 vào ô.", "warning");
      return;
    }
    if (questions.length === 0) {
      showToast("Chưa có câu hỏi nào. Hãy import JSON đề thi trước.", "warning");
      return;
    }
    try {
      const imageData = JSON.parse(imageJsonText.trim());
      if (typeof imageData !== "object" || Array.isArray(imageData)) {
        showToast("JSON ảnh phải là đối tượng {\"question_1\": \"base64...\", ...}", "error");
        return;
      }

      // Thu thập ảnh cần upload (base64 hoặc HTTP URL)
      const imageEntries: [number, string][] = [];
      for (const [key, value] of Object.entries(imageData)) {
        const match = key.match(/^question_(\d+)$/);
        if (match && typeof value === "string" && (value.startsWith("data:image/") || value.startsWith("http"))) {
          imageEntries.push([parseInt(match[1]), value]);
        }
      }

      if (imageEntries.length === 0) {
        showToast("Không tìm thấy ảnh hợp lệ. Format: {\"question_1\": \"data:image/...\"}", "warning");
        return;
      }

      showToast(`Đang upload ${imageEntries.length} ảnh lên ImgBB...`, "info");
      setImportingImages(true);

      // Upload tuần tự để tránh ImgBB rate-limit (Promise.all bị block)
      const urlMap: Record<number, string> = {};

      for (let i = 0; i < imageEntries.length; i++) {
        const [qNum, src] = imageEntries[i];
        try {
          const imgData = src.startsWith("data:image/")
            ? src
            : await (async () => {
                const r = await fetch(src);
                const blob = await r.blob();
                return new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });
              })();

          const res = await fetch("/api/upload-to-imgbb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imgData }),
            signal: AbortSignal.timeout(35000),
          });
          const json = await res.json();
          if (json.url) {
            urlMap[qNum] = json.url;
            showToast(`Đã upload ${i + 1}/${imageEntries.length} ảnh`, "success");
          } else {
            // Retry 1 lần nếu fail
            await new Promise((r) => setTimeout(r, 2000));
            const retry = await fetch("/api/upload-to-imgbb", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: imgData }),
              signal: AbortSignal.timeout(35000),
            });
            const retryJson = await retry.json();
            if (retryJson.url) {
              urlMap[qNum] = retryJson.url;
              showToast(`Retry thành công: ${i + 1}/${imageEntries.length}`, "success");
            } else {
              console.error(`ImgBB fail q${qNum}:`, retryJson.error);
            }
          }
        } catch (e) {
          console.error(`ImgBB upload failed for question_${qNum}:`, e);
        }
        // Delay 2s giữa các request để tránh ImgBB rate-limit
        if (i < imageEntries.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      // Map URL thật vào câu hỏi
      const mergedCount = Object.keys(urlMap).length;
      setQuestions((prev) =>
        prev.map((q, idx) => {
          const url = urlMap[idx + 1];
          return url ? { ...q, imageUrl: url } : q;
        })
      );

      showToast(`Đã gắn ${mergedCount}/${imageEntries.length} ảnh vào câu hỏi!`, mergedCount === imageEntries.length ? "success" : "warning");
    } catch {
      showToast("Lỗi parse JSON ảnh. Vui lòng kiểm tra lại.", "error");
    } finally {
      setImportingImages(false);
    }
  };

  const handleAttachPdfImage = (qIdx: number, url: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, imageUrl: url } : q)));
  };

  const handleAddPdfBlankQuestions = (count: number) => {
    const blanks = Array.from({ length: count }, () => ({
      questionText: "",
      type: "MULTIPLE_CHOICE" as const,
      options: ["", "", "", ""],
      correctAnswer: "0",
      score: 0.25,
      explanation: "",
      imageUrl: "",
    }));
    setQuestions((prev) => [...prev, ...blanks]);
    showToast(`Đã thêm ${count} câu trống. Bạn có thể chỉnh nội dung ở phần dưới.`, "info");
  };

  const handleImportJson = async () => {
    if (!jsonText.trim()) {
      showToast("Vui lòng dán văn bản JSON vào ô.", "warning");
      return;
    }
    try {
      // Try parsing as-is first (handles base64 images correctly)
      let cleaned = jsonText.trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: auto-clean common JSON formatting issues
        cleaned = cleaned.replace(/^[^{\[{]*[\[{]/, (m) => m.slice(-1));
        const lastIdx = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
        if (lastIdx > 0) cleaned = cleaned.substring(0, lastIdx + 1);
        cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
        cleaned = cleaned.replace(/\/\/.*$/gm, "");
        parsed = JSON.parse(cleaned);
      }
      if (!Array.isArray(parsed)) {
        showToast("JSON không hợp lệ. Vui lòng cung cấp một mảng các câu hỏi.", "error");
        return;
      }

      // Detect exam structure (mã đề thi với part_1/part_2/part_3) và tự động chuyển đổi
      if (parsed[0]?.part_1 || parsed[0]?.part_2 || parsed[0]?.part_3) {
        const flatQuestions: any[] = [];
        const letterMap: Record<string, string> = { A: "0", B: "1", C: "2", D: "3" };
        parsed.forEach((exam: any) => {
          if (exam.part_1) exam.part_1.forEach((q: any) => {
            const options = q.options ? [q.options.A || "", q.options.B || "", q.options.C || "", q.options.D || ""] : [];
            flatQuestions.push({
              questionText: q.question_text || "",
              type: "MULTIPLE_CHOICE",
              options,
              correctAnswer: letterMap[q.correct_answer?.toUpperCase()] ?? "0",
              score: 0.25,
              explanation: q.explanation || "",
              imageUrl: ""
            });
          });
          if (exam.part_2) exam.part_2.forEach((q: any) => {
            flatQuestions.push({
              questionText: q.context || "",
              type: "TRUE_FALSE",
              options: q.statements?.map((s: any) => s.statement || "") || [],
              correctAnswer: q.statements?.map((s: any) => s.is_correct ? "T" : "F").join(",") || "",
              score: 1.0,
              explanation: q.explanation || "",
              imageUrl: ""
            });
          });
          if (exam.part_3) exam.part_3.forEach((q: any) => {
            flatQuestions.push({
              questionText: q.question_text || "",
              type: "SHORT_ANSWER",
              options: [],
              correctAnswer: String(q.answer ?? ""),
              score: 0.5,
              explanation: q.explanation || "",
              imageUrl: ""
            });
          });
        });
        parsed = flatQuestions;
      }

      // Chuẩn hoá qua hàm dùng chung (AI + JSON import đều dùng chung 1 logic)
      const formattedQuestions = normalizeQuestions(parsed).map((q) => ({
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        score: q.score,
        explanation: q.explanation || "",
        imageUrl: q.imageUrl || "",
      }));

      // Auto-upload images: collect all base64 data URLs or external URLs
      const needsUpload = formattedQuestions
        .filter((q) => q.imageUrl && (q.imageUrl.startsWith("data:image/") || q.imageUrl.startsWith("http://") || q.imageUrl.startsWith("https://")))
        .map((q) => q.imageUrl);

      if (needsUpload.length > 0) {
        setImportingImages(true);
        showToast(`Đang tải ${needsUpload.length} ảnh lên server...`, "info");
        try {
          const res = await fetch("/api/upload-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: needsUpload }),
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            let uploaded = 0;
            for (const result of data.results) {
              if (result.url) {
                // Find the question with matching imageUrl and replace it
                const src = needsUpload[result.index];
                const target = formattedQuestions.find((q) => q.imageUrl === src);
                if (target) target.imageUrl = result.url;
                uploaded++;
              }
            }
            showToast(`Đã upload thành công ${uploaded}/${needsUpload.length} ảnh!`, uploaded === needsUpload.length ? "success" : "warning");
          } else {
            showToast("Upload ảnh thất bại. Ảnh sẽ giữ nguyên gốc.", "error");
          }
        } catch {
          showToast("Lỗi khi upload ảnh. Ảnh sẽ giữ nguyên gốc.", "error");
        } finally {
          setImportingImages(false);
        }
      }

      setQuestions(formattedQuestions);
      showToast(`Đã tải thành công ${formattedQuestions.length} câu hỏi từ JSON!`, "success");
      setJsonText("");
    } catch (e) {
      showToast("Lỗi parse JSON. Vui lòng kiểm tra lại cấu trúc JSON.", "error");
    }
  };

  const selectedClassIds = useMemo(() => new Set(assignments.map((assignment) => assignment.classId)), [assignments]);
  const canUseAfterAllSubmitted = !isPublic && assignments.length > 0;

  const buildAssignmentPayload = () =>
    assignments.map((assignment) => ({
      classId: assignment.classId,
      deadlineOverride: assignment.deadlineOverride
        ? new Date(assignment.deadlineOverride).toISOString()
        : null,
      startsAtOverride: assignment.startsAtOverride
        ? new Date(assignment.startsAtOverride).toISOString()
        : null,
    }));

  const handleToggleClassAssignment = (classId: string, checked: boolean) => {
    setAssignments((prev) => {
      if (checked) {
        if (prev.some((assignment) => assignment.classId === classId)) return prev;
        return [...prev, { classId, deadlineOverride: "", startsAtOverride: "" }];
      }

      const next = prev.filter((assignment) => assignment.classId !== classId);
      if (next.length === 0 && answerVisibility === "AFTER_ALL_SUBMITTED") {
        setAnswerVisibility("IMMEDIATELY");
      }
      return next;
    });
  };

  const handleAssignmentDateChange = (
    classId: string,
    field: "deadlineOverride" | "startsAtOverride",
    value: string,
  ) => {
    setAssignments((prev) =>
      prev.map((assignment) =>
        assignment.classId === classId ? { ...assignment, [field]: value } : assignment,
      ),
    );
  };

  const getClassName = (classId: string): string => classes.find((item) => item.id === classId)?.name ?? classId;

  const getQuizAssignments = (quiz: QuizItem): QuizAssignmentItem[] => {
    if (quiz.assignments && quiz.assignments.length > 0) {
      return quiz.assignments.map((assignment) => ({
        classId: assignment.classId,
        class: assignment.class ?? null,
        deadlineOverride: assignment.deadlineOverride ? toLocalDateTimeInput(assignment.deadlineOverride) : "",
        startsAtOverride: assignment.startsAtOverride ? toLocalDateTimeInput(assignment.startsAtOverride) : "",
      }));
    }

    return quiz.class?.id ? [{ classId: quiz.class.id, class: quiz.class, deadlineOverride: "", startsAtOverride: "" }] : [];
  };

  const getQuizClassNames = (quiz: QuizItem): string[] => {
    const quizAssignments = quiz.assignments && quiz.assignments.length > 0
      ? quiz.assignments
      : quiz.class?.id
        ? [{ classId: quiz.class.id, class: quiz.class }]
        : [];

    return quizAssignments.map((assignment) => assignment.class?.name ?? getClassName(assignment.classId));
  };

  const getShareTargetClasses = (quiz: QuizItem): { classId: string; className: string }[] => {
    if (quiz.assignments && quiz.assignments.length > 0) {
      return quiz.assignments.map((assignment) => ({
        classId: assignment.classId,
        className: assignment.class?.name || getClassName(assignment.classId),
      }));
    }

    if (quiz.class) {
      return [{ classId: quiz.class.id, className: quiz.class.name }];
    }

    return classes.map((item) => ({ classId: item.id, className: item.name }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const finalDescription = isPublic && !showOnList
      ? `[UNLISTED] ${description || ""}`.trim()
      : description;

    if (modalMode === "EDIT" && editingQuizId) {
      const res = await updateQuiz({
        id: editingQuizId,
        title,
        description: finalDescription || undefined,
        duration: Number(duration),
        passingScore: Number(passingScore),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        subjectId,
        assignments: buildAssignmentPayload(),
        isPublic,
        answerVisibility,
        shuffleQuestions,
        questions,
      });

      if (res.success) {
        showToast("Cập nhật đề kiểm tra thành công!", "success");
        setIsCreateOpen(false);
        resetForm();
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Cập nhật đề thất bại.");
        showToast(res.error || "Cập nhật đề thất bại.", "error");
      }
    } else {
      const res = await createQuiz({
        title,
        description: finalDescription || undefined,
        duration: Number(duration),
        passingScore: Number(passingScore),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        subjectId,
        assignments: buildAssignmentPayload(),
        isPublic,
        answerVisibility,
        shuffleQuestions,
        questions,
      });

      if (res.success) {
        showToast("Tạo đề kiểm tra trắc nghiệm thành công!", "success");
        setIsCreateOpen(false);
        resetForm();
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Tạo đề thất bại.");
        showToast(res.error || "Tạo đề thất bại.", "error");
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDuration(15);
    setPassingScore(5);
    setSubjectId("");
    setAssignments([]);
    setIsPublic(false);
    setShowOnList(true);
    setAnswerVisibility("IMMEDIATELY");
    setShuffleQuestions(true);
    setDeadline("");
    setQuestions([{ questionText: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: "0", score: 1, explanation: "", imageUrl: "" }]);
    setModalMode("CREATE");
    setEditingQuizId(null);
    setPdfFile(null);
    setImportMethod("JSON");
  };

  // Convert ISO deadline → giá trị <input type="datetime-local"> (giờ địa phương)
  const toLocalDateTimeInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleEditClick = (q: QuizItem) => {
    setModalMode("EDIT");
    setEditingQuizId(q.id);
    setTitle(q.title);
    const rawDesc = q.description || "";
    const isUnlisted = rawDesc.includes("[UNLISTED]");
    setDescription(rawDesc.replace("[UNLISTED]", "").trim());
    setShowOnList(!isUnlisted);
    setDuration(q.duration);
    setPassingScore(q.passingScore);
    setSubjectId(q.subject.id);
    const quizAssignments = getQuizAssignments(q);
    setAssignments(quizAssignments);
    setIsPublic(q.isPublic || false);
    setShuffleQuestions(q.shuffleQuestions ?? true);
    setDeadline(q.deadline ? toLocalDateTimeInput(q.deadline) : "");
    setAnswerVisibility(
      q.answerVisibility === "AFTER_ALL_SUBMITTED" && quizAssignments.length > 0 && !q.isPublic
        ? "AFTER_ALL_SUBMITTED"
        : q.answerVisibility === "WHEN_ENDED" || q.answerVisibility === "NEVER"
        ? "WHEN_ENDED"
        : "IMMEDIATELY"
    );
    if (q.questions && q.questions.length > 0) {
      setQuestions(q.questions.map((qn) => ({
        questionText: qn.text,
        type: qn.type as any,
        options: qn.options as string[],
        correctAnswer: qn.correctAnswer,
        score: qn.score,
        explanation: qn.explanation || "",
        imageUrl: qn.imageUrl || "",
      })));
    } else {
      setQuestions([{ questionText: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: "0", score: 1, explanation: "", imageUrl: "" }]);
    }
    setIsCreateOpen(true);
  };

  const handleShareClick = (quiz: QuizItem) => {
    setManualShareClassId("");
    setShareModalQuiz(quiz);
  };

  const renderQuestionEditor = (q: any, qIdx: number, displayIdx: number) => {
    return (
      <div key={qIdx} className="border border-hairline rounded-lg p-5 flex flex-col gap-4 bg-surface-pearl relative text-left">
        <button
          type="button"
          onClick={() => handleRemoveQuestion(qIdx)}
          className="absolute top-2 right-2 text-ink-muted-48 hover:text-red-500"
          title="Xoá câu hỏi này"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Question text (full width, không bị dropdown đè) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Câu hỏi {displayIdx}</label>
          <input
            type="text"
            value={q.questionText}
            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
            placeholder="Nội dung câu hỏi..."
            className="bg-canvas border border-hairline rounded-pill px-4 py-2 text-xs text-ink outline-none focus:border-primary-focus w-full"
            required
          />
        </div>

        {/* Dạng thức — tách riêng hàng dưới, không che nội dung câu hỏi */}
        <div className="flex flex-col gap-1.5 max-w-xs">
          <label className="text-xs font-semibold text-ink">Dạng thức đề THPT 2026</label>
          <select
            value={q.type}
            onChange={(e) => handleTypeChange(qIdx, e.target.value as any)}
            className="bg-canvas border border-hairline rounded-pill px-3 py-2 text-xs outline-none w-full"
          >
            <option value="MULTIPLE_CHOICE">Dạng thức I (4 lựa chọn)</option>
            <option value="TRUE_FALSE">Dạng thức II (Đúng/Sai)</option>
            <option value="SHORT_ANSWER">Dạng thức III (Trả lời ngắn/Điền số)</option>
          </select>
        </div>

        {/* Conditional options rendering depending on type */}
        {q.type === "MULTIPLE_CHOICE" && (
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt: string, optIdx: number) => (
              <div key={optIdx} className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-ink-muted-80">Phương án {String.fromCharCode(65 + optIdx)}</label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                  placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}`}
                  className="bg-canvas border border-hairline rounded-pill px-4 py-1.5 text-xs text-ink outline-none focus:border-primary-focus w-full"
                  required
                />
              </div>
            ))}
          </div>
        )}

        {q.type === "TRUE_FALSE" && (
          <div className="flex flex-col gap-3 bg-canvas p-3 border border-hairline rounded-lg">
            <span className="text-[10px] font-bold text-ink-muted-48 uppercase">Khai báo 4 phát biểu và đáp án đúng/sai</span>
            {q.options.map((opt: string, optIdx: number) => {
              const currentAnswers = (q.correctAnswer || "T,T,T,T").split(",");
              const tfVal = currentAnswers[optIdx] || "T";
              return (
                <div key={optIdx} className="grid grid-cols-12 gap-3 items-center">
                  <span className="col-span-1 text-xs font-bold text-center">{String.fromCharCode(97 + optIdx)})</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                    placeholder={`Ý phát biểu ${String.fromCharCode(97 + optIdx)}`}
                    className="col-span-8 bg-canvas border border-hairline rounded px-3 py-1 text-xs outline-none"
                    required
                  />
                  <select
                    value={tfVal}
                    onChange={(e) => handleTrueFalseCorrectChange(qIdx, optIdx, e.target.value as any)}
                    className="col-span-3 bg-canvas border border-hairline rounded px-2 py-1 text-xs outline-none"
                  >
                    <option value="T">Đúng</option>
                    <option value="F">Sai</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* Answer & score footer */}
        <div className="grid grid-cols-2 gap-4 mt-2 border-t border-divider-soft pt-3">
          {q.type === "MULTIPLE_CHOICE" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-ink-muted-80">Đáp án chính xác</label>
              <select
                value={q.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(qIdx, e.target.value)}
                className="bg-canvas border border-hairline rounded-pill px-3 py-1.5 text-xs outline-none w-full"
              >
                <option value="0">Phương án A</option>
                <option value="1">Phương án B</option>
                <option value="2">Phương án C</option>
                <option value="3">Phương án D</option>
              </select>
            </div>
          )}

          {q.type === "SHORT_ANSWER" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-ink-muted-80">Giá trị đáp số chính xác</label>
              <input
                type="text"
                value={q.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(qIdx, e.target.value)}
                placeholder="Ví dụ: -1.25 hoặc 10"
                className="bg-canvas border border-hairline rounded-pill px-4 py-1.5 text-xs outline-none w-full text-center"
                required
              />
            </div>
          )}

          {/* Display read-only representation for true/false correct answers */}
          {q.type === "TRUE_FALSE" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-ink-muted-80">Chuỗi đáp án (Đ/S)</label>
              <input
                type="text"
                value={q.correctAnswer.split(",").map((c: string) => c === "T" ? "Đúng" : "Sai").join(", ")}
                className="bg-slate-100 border border-hairline rounded-pill px-4 py-1.5 text-xs text-ink-muted-80 w-full text-center"
                disabled
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-ink-muted-80">Điểm số câu hỏi</label>
            <input
              type="number"
              step="0.05"
              value={q.score}
              onChange={(e) => handleScoreChange(qIdx, Number(e.target.value))}
              className="bg-canvas border border-hairline rounded-pill px-3 py-1.5 text-xs outline-none w-full text-center"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[10px] font-semibold text-ink-muted-80">Ảnh minh họa câu hỏi (Tùy chọn)</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={q.imageUrl || ""}
              onChange={(e) => handleImageUrlChange(qIdx, e.target.value)}
              placeholder="Dán link ảnh hoặc bấm nút upload →"
              className="bg-canvas border border-hairline rounded-pill px-4 py-2 text-xs text-ink outline-none focus:border-primary-focus flex-1 min-w-0"
            />
            <input
              ref={(el) => { imageFileRefs.current[qIdx] = el; }}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingIdx(qIdx);
                try {
                  const fd = new FormData();
                  fd.append("image", file);
                  const res = await fetch("/api/upload-image", { method: "POST", body: fd });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? "Upload thất bại");
                  handleImageUrlChange(qIdx, data.url);
                  showToast("✅ Upload ảnh thành công!", "success");
                } catch (err) {
                  showToast(`❌ ${err instanceof Error ? err.message : "Upload thất bại"}`, "error");
                } finally {
                  setUploadingIdx(null);
                  e.target.value = "";
                }
              }}
            />
            <button
              type="button"
              title="Upload ảnh lên ImgBB"
              disabled={uploadingIdx === qIdx}
              onClick={() => imageFileRefs.current[qIdx]?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-[10px] font-semibold border border-hairline bg-canvas hover:bg-surface text-ink-muted-80 hover:text-ink transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {uploadingIdx === qIdx
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <ImagePlus className="h-3.5 w-3.5" />}
              {uploadingIdx === qIdx ? "Đang tải..." : "Upload"}
            </button>
          </div>
          {q.imageUrl && q.imageUrl.trim() && (
            <div className="mt-1 border border-hairline rounded p-1 max-w-[150px] bg-canvas self-start">
              <img src={q.imageUrl} alt="Xem trước" className="max-h-24 w-auto rounded object-contain mx-auto" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[10px] font-semibold text-ink-muted-80">Lời giải thích / Hướng dẫn giải (Hỗ trợ LaTeX $...$)</label>
          <textarea
            rows={2}
            value={q.explanation || ""}
            onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
            placeholder="Nhập lời giải thích hoặc hướng dẫn cách giải câu hỏi này..."
            className="bg-canvas border border-hairline rounded-lg p-2.5 text-xs outline-none focus:border-primary-focus w-full"
          />
        </div>
      </div>
    );
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
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-ink">Danh sách các bài test bạn quản lý</span>
        </div>
        <button
          onClick={() => {
            resetForm();
            setModalMode("CREATE");
            setIsCreateOpen(true);
          }}
          className="bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-pill text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tạo đề thi trắc nghiệm mới
        </button>
      </div>

      {/* Search & filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-canvas border border-hairline rounded-lg p-3 shadow-sm">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên đề, môn học, người tạo..."
            className="bg-canvas border border-hairline rounded-pill pl-9 pr-3 py-2 text-xs text-ink outline-none focus:border-primary-focus w-full"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="bg-canvas border border-hairline rounded-pill px-3 py-2 text-xs text-ink outline-none focus:border-primary-focus w-full sm:w-44"
        >
          <option value="">Tất cả môn học</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          className="bg-canvas border border-hairline rounded-pill px-3 py-2 text-xs text-ink outline-none focus:border-primary-focus w-full sm:w-40"
        >
          <option value="">Tất cả đề thi</option>
          <option value="PUBLIC">Công khai</option>
          <option value="INTERNAL">Nội bộ</option>
        </select>
        {(searchQuery || subjectFilter || visibilityFilter) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSubjectFilter("");
              setVisibilityFilter("");
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-pill text-xs font-semibold border border-hairline text-ink-muted-80 hover:bg-surface transition-colors whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" /> Xoá lọc
          </button>
        )}
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.length === 0 ? (
          <div className="col-span-2 bg-canvas border border-hairline p-16 text-center rounded-lg">
            <Award className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">Bạn chưa tạo bài test/đề thi nào.</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="col-span-2 bg-canvas border border-hairline p-16 text-center rounded-lg">
            <Search className="h-12 w-12 text-ink-muted-48 mx-auto mb-4" />
            <p className="font-body text-ink-muted-80">Không tìm thấy đề thi nào khớp với bộ lọc.</p>
          </div>
        ) : (
          filteredQuizzes.map((q) => (
            <div key={q.id} className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-primary px-2.5 py-0.5 rounded-full">
                      {q.subject.name}
                    </span>
                    {(() => {
                      const classNames = getQuizClassNames(q);
                      if (classNames.length === 0) return null;

                      return (
                        <span
                          title={classNames.join(", ")}
                          className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full"
                        >
                          {classNames.length === 1 ? `Lớp ${classNames[0]}` : `${classNames.length} lớp`}
                        </span>
                      );
                    })()}
                    {q.isPublic ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                        Công khai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-ink-muted-80 px-2.5 py-0.5 rounded-full">
                        Nội bộ
                      </span>
                    )}
                    <span className="text-xs text-ink-muted-48 font-semibold ml-auto">{q._count.questions} câu hỏi</span>
                  </div>
                  {isAdmin && q.creatorName && (
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 self-start">
                      Người tạo: {q.creatorName}
                    </span>
                  )}
                </div>
                <h3 className="font-body-strong text-base font-bold text-ink leading-snug">
                  {q.title}
                </h3>
                {q.description && (
                  <p className="text-xs text-ink-muted-80 font-body line-clamp-2">{q.description}</p>
                )}
                
                {(() => {
                  const subCount = q.submissions?.length ?? 0;
                  const avgScore = subCount > 0
                    ? (q.submissions!.reduce((acc, s) => acc + s.score, 0) / subCount).toFixed(1)
                    : "N/A";
                  return (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-muted-80 mt-1 font-body">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {q.duration} phút
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        Đạt: {q.passingScore}
                      </span>
                      <span className="flex items-center gap-1 text-primary bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <UserCheck className="h-3 w-3" />
                        {subCount}
                      </span>
                      <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 font-semibold">
                        <BarChart2 className="h-3 w-3" />
                        {avgScore}đ
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="border-t border-divider-soft pt-3 flex justify-end gap-2 flex-wrap">
                <button
                  onClick={() => handleViewSubmissions(q)}
                  className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Award className="h-3.5 w-3.5" /> Kết quả
                </button>
                <button
                  onClick={() => handleShareClick(q)}
                  className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" /> Chia sẻ
                </button>
                <button
                  onClick={() => handleEditClick(q)}
                  className="bg-blue-50 text-primary hover:bg-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(q.id, q.title)}
                  className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xoá
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE QUIZ MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[650px] max-w-full shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                {modalMode === "EDIT" ? "Chỉnh sửa đề trắc nghiệm" : "Tạo đề trắc nghiệm mới THPT 2026"}
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-ink-muted-48 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center justify-between gap-3 text-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  <button type="button" onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800"><X className="h-4 w-4" /></button>
                </div>
              )}
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Tiêu đề bài kiểm tra</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Kiểm tra Giữa kỳ II - Toán 12"
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

                {/* Stitch UI: Multi-Class Quiz Assignment Interface Section */}
                <div className="flex flex-col gap-4 md:col-span-2 border border-blue-200 rounded-xl bg-blue-50/30 p-4 shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-blue-100 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <h4 className="text-sm font-bold text-ink">Phân phối Lớp học & Cài đặt Lịch thi riêng</h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-blue-100 px-2.5 py-0.5 rounded-full">
                        QuizClassAssignment
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted-80">
                      Thiết lập thời gian mở đề (startsAtOverride) và hạn chót (deadlineOverride) độc lập cho từng lớp phụ trách.
                    </p>
                  </div>

                  {/* Selected Class Pills & Add Class selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-ink-muted-80">Lớp được phân công:</span>
                    {assignments.length === 0 ? (
                      <span className="text-xs italic text-ink-muted-48">Chưa chọn lớp (mở cho tất cả học sinh thuộc tổ)</span>
                    ) : (
                      assignments.map((assignment) => (
                        <span
                          key={assignment.classId}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-xs"
                        >
                          {getClassName(assignment.classId)}
                          <button
                            type="button"
                            onClick={() => handleToggleClassAssignment(assignment.classId, false)}
                            className="hover:text-red-200 transition-colors"
                            title="Bỏ chọn lớp này"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Class Selection Checkboxes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-canvas p-3 rounded-lg border border-hairline">
                    {classes.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                          selectedClassIds.has(item.id)
                            ? "border-primary bg-blue-50/60 text-primary"
                            : "border-hairline bg-canvas text-ink-muted-80 hover:bg-surface-pearl"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClassIds.has(item.id)}
                          onChange={(e) => handleToggleClassAssignment(item.id, e.target.checked)}
                          className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        {item.name}
                      </label>
                    ))}
                  </div>

                  {/* Per-Class Schedule Table */}
                  {assignments.length > 0 && (
                    <div className="border border-hairline rounded-lg overflow-x-auto bg-canvas shadow-xs">
                      <table className="w-full min-w-[580px] text-left text-xs font-body border-collapse">
                        <thead>
                          <tr className="bg-surface-pearl text-ink-muted-80 border-b border-divider font-semibold text-[10px] uppercase tracking-wider">
                            <th className="p-3">Lớp phụ trách</th>
                            <th className="p-3">Giờ mở đề riêng (startsAtOverride)</th>
                            <th className="p-3">Hạn nộp riêng (deadlineOverride)</th>
                            <th className="p-3 text-center">Trạng thái áp dụng</th>
                            <th className="p-3 text-center">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider-soft">
                          {assignments.map((assignment) => {
                            const hasOverride = Boolean(assignment.startsAtOverride || assignment.deadlineOverride);
                            return (
                              <tr key={assignment.classId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-bold text-ink">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                    <span>{getClassName(assignment.classId)}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="datetime-local"
                                    value={assignment.startsAtOverride ?? ""}
                                    onChange={(e) => handleAssignmentDateChange(assignment.classId, "startsAtOverride", e.target.value)}
                                    className="bg-canvas border border-hairline rounded-pill px-3 py-1.5 text-xs text-ink outline-none focus:border-primary-focus w-full"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="datetime-local"
                                    value={assignment.deadlineOverride ?? ""}
                                    onChange={(e) => handleAssignmentDateChange(assignment.classId, "deadlineOverride", e.target.value)}
                                    className="bg-canvas border border-hairline rounded-pill px-3 py-1.5 text-xs text-ink outline-none focus:border-primary-focus w-full"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  {hasOverride ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                      ✓ Lịch riêng
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                      Theo lịch chung
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleClassAssignment(assignment.classId, false)}
                                    className="p-1 text-ink-muted-48 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Gỡ lớp này"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="p-2.5 bg-surface-pearl border-t border-hairline text-[11px] text-ink-muted-80 italic">
                        * Lưu ý: Nếu để trống ô thời gian của lớp, học sinh thuộc lớp đó sẽ tự động tuân theo Lịch mặc định chung của đề thi.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 md:col-span-2 mt-2 bg-surface-pearl border border-divider-soft p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => {
                        setIsPublic(e.target.checked);
                        if (!e.target.checked) setShowOnList(true);
                        // Đề public hạ cấp AFTER_ALL_SUBMITTED nếu không chọn lớp
                        if (e.target.checked && answerVisibility === "AFTER_ALL_SUBMITTED") setAnswerVisibility("IMMEDIATELY");
                      }}
                      className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="isPublic" className="text-xs font-bold text-ink cursor-pointer">Công khai đề thi (Public)</label>
                      <span className="text-[10px] text-ink-muted-48">Cho phép khách làm đề thi này tại trang chủ mà không cần đăng nhập tài khoản.</span>
                    </div>
                  </div>

                  {isPublic && (
                    <div className="flex items-center gap-2 border-t border-divider-soft pt-2.5 mt-0.5">
                      <input
                        type="checkbox"
                        id="showOnList"
                        checked={showOnList}
                        onChange={(e) => setShowOnList(e.target.checked)}
                        className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <label htmlFor="showOnList" className="text-xs font-bold text-ink cursor-pointer">Hiển thị trên danh sách làm đề thi thử</label>
                        <span className="text-[10px] text-ink-muted-48">Đề thi sẽ xuất hiện trên trang danh sách công khai. Nếu tắt, chỉ truy cập được bằng liên kết chia sẻ trực tiếp.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Quyền xem đáp án & lời giải</label>
                  <select
                    value={answerVisibility}
                    onChange={(e) => setAnswerVisibility(e.target.value)}
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                    required
                  >
                    <option value="IMMEDIATELY">Xem đáp án và giải thích ngay sau khi làm xong bài</option>
                    <option value="WHEN_ENDED">Xem đáp án và giải thích khi hết thời hạn có thể làm đề thi</option>
                    <option value="AFTER_ALL_SUBMITTED" disabled={!canUseAfterAllSubmitted}>
                      Hiển thị đáp án sau khi tất cả thành viên trong lớp nộp bài
                    </option>
                  </select>
                  {isPublic && (
                    <span className="text-[10px] text-ink-muted-48">Đề công khai không có tùy chọn "sau khi cả lớp nộp bài" (không có khái niệm lớp).</span>
                  )}
                  {!isPublic && assignments.length === 0 && (
                    <span className="text-[10px] text-ink-muted-48">Chọn ít nhất một lớp để bật chế độ hiển thị đáp án sau khi cả lớp nộp bài.</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 bg-surface-pearl border border-divider-soft p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shuffleQuestions"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="shuffleQuestions" className="text-xs font-bold text-ink cursor-pointer">🔀 Xáo trộn câu hỏi & đáp án (mỗi lượt làm bài khác nhau)</label>
                      <span className="text-[10px] text-ink-muted-48">Mỗi lần thí sinh bắt đầu làm bài, thứ tự câu hỏi và các phương án sẽ được xáo trộn ngẫu nhiên. Đề vẫn dùng chung một link.</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:col-span-2">
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
                  <label className="text-xs font-caption-strong text-ink-muted-80">Thời gian đóng đề (Deadline — Tùy chọn)</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  />
                  <span className="text-[10px] text-ink-muted-48">Bỏ trống = không đóng đề. Sau deadline học sinh VẪN làm được nhưng hiển thị "Nộp muộn".</span>
                </div>
              </div>

              {/* Import Method Toggle Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setImportMethod("JSON")}
                  className={`px-4 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                    importMethod === "JSON"
                      ? "bg-primary border-primary text-white shadow-sm"
                      : "bg-surface-pearl border-divider text-ink-muted-80 hover:bg-canvas"
                  }`}
                >
                  Dán JSON
                </button>
                <button
                  type="button"
                  onClick={() => setImportMethod("PDF")}
                  className={`px-4 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                    importMethod === "PDF"
                      ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                      : "bg-surface-pearl border-divider text-ink-muted-80 hover:bg-canvas"
                  }`}
                >
                  PDF → Chọn vùng ảnh
                </button>
                <button
                  type="button"
                  onClick={() =>
                    showToast("Tính năng tạo đề thi bằng AI đang được phát triển.", "info")
                  }
                  className="px-4 py-1.5 rounded-pill text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-not-allowed bg-surface-pearl border-divider text-ink-muted-80 opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Tạo bằng AI
                </button>
              </div>



              {/* JSON FILE IMPORT */}
              {importMethod === "JSON" && (
                <div className="border border-divider rounded-lg p-4 bg-surface-pearl flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-orange-600" /> Nhập danh sách câu hỏi bằng mã JSON
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={downloadJsonTemplate}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Tải JSON mẫu đề thi
                      </button>
                      <button
                        type="button"
                        onClick={downloadSkillFile}
                        className="text-xs text-amber-600 hover:underline font-semibold"
                      >
                        Tải hướng dẫn tạo đề bằng JSON
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="Dán mảng cấu trúc JSON vào đây. Ví dụ: [{ &quot;questionText&quot;: &quot;...&quot;, &quot;options&quot;: [&quot;A&quot;,&quot;B&quot;], &quot;correctAnswer&quot;: &quot;0&quot; }]"
                    className="bg-canvas border border-hairline rounded-lg p-3 text-xs outline-none focus:border-primary-focus w-full font-mono text-[10px]"
                  />
                  <button
                    type="button"
                    onClick={handleImportJson}
                    disabled={importingImages}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2 rounded-pill shadow-sm self-end disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {importingImages ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải ảnh...</>
                    ) : (
                      "Import từ JSON"
                    )}
                  </button>
                </div>
              )}

              {/* IMAGE JSON MERGE - Phase 2 */}
              {importMethod === "JSON" && questions.length > 0 && (
                <div className="border border-dashed border-amber-300 rounded-lg p-4 bg-amber-50/50 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-ink">Bước 2: Gắn ảnh base64 vào câu hỏi</span>
                  </div>
                  <p className="text-[10px] text-ink-muted-80">
                    Dán JSON chứa ảnh base64 và vị trí câu hỏi. Format: <code className="bg-amber-100 px-1 rounded">{"{"}"question_1": "data:image/png;base64,...", "question_7": "data:image/png;base64,..."{"}"}</code>
                  </p>
                  <textarea
                    rows={4}
                    value={imageJsonText}
                    onChange={(e) => setImageJsonText(e.target.value)}
                    placeholder={"{\"question_7\": \"data:image/png;base64,...\", \"question_3\": \"data:image/jpeg;base64,...\"}"}
                    className="bg-canvas border border-hairline rounded-lg p-3 text-[10px] outline-none focus:border-primary-focus w-full font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleMergeImages}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-pill shadow-sm self-end"
                  >
                    Gắn ảnh vào câu hỏi
                  </button>
                </div>
              )}

              {/* PDF REGION SELECTOR - Phase 2 */}
              {importMethod === "PDF" && (
                <div className="flex flex-col gap-3">
                  {!pdfFile ? (
                    <div className="border border-dashed border-purple-300 rounded-lg p-6 bg-purple-50/30 flex flex-col items-center gap-3">
                      <Scissors className="h-8 w-8 text-purple-500" />
                      <div className="text-center flex flex-col gap-1">
                        <span className="text-sm font-bold text-ink">Chọn tài liệu PDF để khoanh vùng ảnh</span>
                        <span className="text-[10px] text-ink-muted-48">
                          Upload file PDF (đề thi, tài liệu scan), sau đó kéo chuột vẽ vùng trên từng trang để gắn vào câu hỏi. Tối đa 50MB.
                        </span>
                      </div>
                      <label className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-pill shadow-sm cursor-pointer">
                        <Upload className="h-3.5 w-3.5" /> Chọn file PDF
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 50 * 1024 * 1024) {
                              showToast("PDF tối đa 50MB.", "error");
                              return;
                            }
                            setPdfFile(file);
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      <PDFRegionSelector
                        key={`${pdfFile.name}-${pdfFile.size}`}
                        file={pdfFile}
                        questions={questions}
                        onAttachImage={handleAttachPdfImage}
                        onAddBlankQuestions={handleAddPdfBlankQuestions}
                      />
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="self-start text-xs px-3 py-1.5 rounded-pill border border-hairline text-ink-muted-80 hover:bg-surface"
                      >
                        Chọn PDF khác
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* AI GENERATE PANEL */}
              <div className="flex flex-col gap-3 border border-amber-300 rounded-lg p-4 bg-amber-50/50">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-ink">Tạo đề thi bằng AI</span>
                </div>
                <p className="text-[11px] text-ink-muted-80">
                  Tính năng tạo đề thi bằng AI đang được phát triển. Vui lòng quay lại sau.
                </p>
              </div>

              {/* Formula & formatting instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-[11px] text-ink-muted-80 font-body leading-relaxed flex flex-col gap-2">
                <span className="font-semibold text-ink block">💡 Hướng dẫn định dạng câu hỏi:</span>
                <span>• <strong>Ảnh minh họa:</strong> đặt base64 data URL (<code className="bg-blue-100 px-1 rounded">"data:image/png;base64,..."</code>) hoặc link ảnh bên ngoài vào trường <code className="bg-blue-100 px-1 rounded">imageUrl</code>. Hệ thống tự động upload lên Cloudinary khi import.</span>
                <span>• <strong>Công thức Toán học:</strong> nhập trong cặp dấu <code className="bg-blue-100 px-1 rounded">$...$</code> — ví dụ: <code className="bg-blue-100 px-1 rounded">$x^2 + 1$</code></span>
                <span>• <strong>Câu hỏi nhiều bước / dài:</strong> dùng <code className="bg-blue-100 px-1 rounded">\n</code> trong chuỗi JSON để xuống dòng. Hệ thống sẽ tự nhận diện và định dạng đẹp:<br />
                  — <code className="bg-blue-100 px-1 rounded">- Bước 1: ...</code> → hiển thị như bước có mũi tên<br />
                  — <code className="bg-blue-100 px-1 rounded">(a) ...</code>, <code className="bg-blue-100 px-1 rounded">(b) ...</code> → indent thụt vào như phát biểu con
                </span>
                <span>• <strong>Tip:</strong> Tải file JSON mẫu ở trên để xem ví dụ câu nhiều bước đã được định dạng sẵn.</span>
              </div>

              {/* Questions List & Fields Editor */}
              <div className="border-t border-divider-soft pt-4 flex flex-col gap-6">
                <h4 className="text-xs font-caption-strong text-ink uppercase tracking-wider">Danh sách câu hỏi trắc nghiệm ({questions.length} câu)</h4>
                
                {/* PHẦN I */}
                {(() => {
                  const part1Questions = questions.map((q, idx) => ({ q, idx })).filter(item => item.q.type === "MULTIPLE_CHOICE");
                  return (
                    <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                      <div className="flex justify-between items-center border-b border-divider pb-2 mb-2">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-800">PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn</span>
                          <span className="text-[10px] text-ink-muted-48">Mỗi câu hỏi thí sinh chỉ chọn một phương án. Thí sinh trả lời từ câu 1 đến câu {part1Questions.length}.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddQuestionByType("MULTIPLE_CHOICE")}
                          className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Thêm câu hỏi Phần I
                        </button>
                      </div>
                      
                      {part1Questions.length === 0 ? (
                        <div className="text-center py-4 text-xs text-ink-muted-48 italic">Chưa có câu hỏi Phần I</div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {part1Questions.map((item, index) => renderQuestionEditor(item.q, item.idx, index + 1))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* PHẦN II */}
                {(() => {
                  const part2Questions = questions.map((q, idx) => ({ q, idx })).filter(item => item.q.type === "TRUE_FALSE");
                  return (
                    <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                      <div className="flex justify-between items-center border-b border-divider pb-2 mb-2">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-800">PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai</span>
                          <span className="text-[10px] text-ink-muted-48">Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai. Thí sinh trả lời từ câu 1 đến câu {part2Questions.length}.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddQuestionByType("TRUE_FALSE")}
                          className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Thêm câu hỏi Phần II
                        </button>
                      </div>
                      
                      {part2Questions.length === 0 ? (
                        <div className="text-center py-4 text-xs text-ink-muted-48 italic">Chưa có câu hỏi Phần II</div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {part2Questions.map((item, index) => renderQuestionEditor(item.q, item.idx, index + 1))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* PHẦN III */}
                {(() => {
                  const part3Questions = questions.map((q, idx) => ({ q, idx })).filter(item => item.q.type === "SHORT_ANSWER");
                  return (
                    <div className="flex flex-col gap-4 border border-divider-soft rounded-xl p-4 bg-slate-50/50">
                      <div className="flex justify-between items-center border-b border-divider pb-2 mb-2">
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-800">PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn</span>
                          <span className="text-[10px] text-ink-muted-48">Thí sinh trả lời đáp số ngắn vào ô trống. Thí sinh trả lời từ câu 1 đến câu {part3Questions.length}.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddQuestionByType("SHORT_ANSWER")}
                          className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Thêm câu hỏi Phần III
                        </button>
                      </div>
                      
                      {part3Questions.length === 0 ? (
                        <div className="text-center py-4 text-xs text-ink-muted-48 italic">Chưa có câu hỏi Phần III</div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {part3Questions.map((item, index) => renderQuestionEditor(item.q, item.idx, index + 1))}
                        </div>
                      )}
                    </div>
                  );
                })()}
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

      {/* Submissions Results & Multi-Class Analytics View Modal (Stitch Screen 61a756a6) */}
      {isSubmissionsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-xl w-[880px] max-w-full shadow-2xl flex flex-col overflow-hidden animate-fade-in max-h-[90vh]">
            {/* Modal Header */}
            <div className="border-b border-divider p-5 bg-surface-pearl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <h3 className="font-tagline text-base font-bold text-ink">
                    EduWeb - Kết quả thi & Thống kê điểm theo lớp (QuizClassAssignment)
                  </h3>
                </div>
                <p className="text-xs text-ink-muted-80 font-semibold">{selectedQuizTitle}</p>
              </div>
              <button
                onClick={() => setIsSubmissionsOpen(false)}
                className="hover:bg-surface-pearl p-1.5 rounded-full text-ink-muted-80 hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              {loadingSubmissions ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs text-ink-muted-80 font-body">Đang tải kết quả thi & phân tích dữ liệu đa lớp...</span>
                </div>
              ) : (
                (() => {
                  const passingScore = submissionsQuizInfo?.passingScore ?? 5;
                  const quizAssignments: any[] = submissionsQuizInfo?.assignments ?? [];
                  const submissionClassTabs = submissionsList.reduce((acc: any[], submission) => {
                    const groups = submission.classGroups && submission.classGroups.length > 0
                      ? submission.classGroups
                      : submission.classId
                      ? [{ id: submission.classId, name: submission.classes }]
                      : [];

                    groups.forEach((group: { id: string; name: string }) => {
                      if (!acc.some((item) => item.classId === group.id)) {
                        const classSubmissions = submissionsList.filter(
                          (item) => item.classId === group.id || (item.classIds && item.classIds.includes(group.id)),
                        );
                        acc.push({
                          classId: group.id,
                          className: group.name,
                          studentCount: classSubmissions.length,
                        });
                      }
                    });

                    return acc;
                  }, []);
                  const shareClassTabs: ClassTabItem[] = submissionsQuiz
                    ? getShareTargetClasses(submissionsQuiz).map((item) => ({
                        classId: item.classId,
                        className: item.className,
                        studentCount: 0,
                        deadlineOverride: null,
                        startsAtOverride: null,
                      }))
                    : [];
                  const assignmentsList: ClassTabItem[] = quizAssignments.length > 0
                    ? quizAssignments
                    : submissionClassTabs.length > 0
                    ? submissionClassTabs
                    : shareClassTabs;

                  const freeSubmissions = submissionsList.filter((s) => !s.classId && (!s.classIds || s.classIds.length === 0));

                  // Calculate filtered submissions by class tab
                  const filteredSubmissions = selectedClassTab === "ALL"
                    ? submissionsList
                    : selectedClassTab === "UNASSIGNED"
                    ? freeSubmissions
                    : submissionsList.filter((s) => s.classId === selectedClassTab || (s.classIds && s.classIds.includes(selectedClassTab)));

                  const totalSubmissions = filteredSubmissions.length;
                  const avgScoreNum = totalSubmissions > 0
                    ? filteredSubmissions.reduce((acc, s) => acc + Number(s.score), 0) / totalSubmissions
                    : 0;
                  const avgScoreStr = avgScoreNum.toFixed(2);

                  const passedCount = filteredSubmissions.filter((s) => Number(s.score) >= passingScore).length;
                  const passPercentage = totalSubmissions > 0
                    ? ((passedCount / totalSubmissions) * 100).toFixed(1)
                    : "0.0";

                  const scores = filteredSubmissions.map((s) => Number(s.score));
                  const maxScoreStr = scores.length > 0 ? Math.max(...scores).toFixed(1) : "0.0";
                  const minScoreStr = scores.length > 0 ? Math.min(...scores).toFixed(1) : "0.0";

                  // Tier breakdown (Giỏi >= 8.0, Khá 6.5-7.9, TB 5.0-6.4, Yếu < 5.0)
                  const gioicount = filteredSubmissions.filter((s) => Number(s.score) >= 8.0).length;
                  const khaCount = filteredSubmissions.filter((s) => Number(s.score) >= 6.5 && Number(s.score) < 8.0).length;
                  const tbCount = filteredSubmissions.filter((s) => Number(s.score) >= 5.0 && Number(s.score) < 6.5).length;
                  const yeuCount = filteredSubmissions.filter((s) => Number(s.score) < 5.0).length;

                  return (
                    <div className="flex flex-col gap-6">
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Tổng lượt nộp</span>
                          <span className="text-2xl font-bold text-ink">{totalSubmissions}</span>
                          <span className="text-[10px] text-ink-muted-48">Đã hoàn thành bài làm</span>
                        </div>

                        <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">ĐTB Khối / Lớp</span>
                          <span className="text-2xl font-bold text-purple-900">{avgScoreStr} <span className="text-xs text-purple-600 font-normal">/ 10</span></span>
                          <span className="text-[10px] text-purple-700/70">Điểm trung bình tích luỹ</span>
                        </div>

                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Tỷ lệ đạt (≥ {passingScore})</span>
                          <span className="text-2xl font-bold text-emerald-900">{passPercentage}%</span>
                          <span className="text-[10px] text-emerald-700/70">{passedCount}/{totalSubmissions} thí sinh</span>
                        </div>

                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Điểm Cao / Thấp</span>
                          <span className="text-xl font-bold text-amber-900">{maxScoreStr} <span className="text-xs font-normal text-amber-700">|</span> {minScoreStr}</span>
                          <span className="text-[10px] text-amber-700/70">Chênh lệch điểm thi</span>
                        </div>
                      </div>

                      {/* Class Filter Tabs */}
                      {(assignmentsList.length > 0 || freeSubmissions.length > 0) && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-bold text-ink">Phân lọc theo Lớp học (QuizClassAssignment):</span>
                          <div className="flex flex-wrap gap-2 border-b border-divider pb-3">
                            <button
                              type="button"
                              onClick={() => setSelectedClassTab("ALL")}
                              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                selectedClassTab === "ALL"
                                  ? "bg-primary text-white shadow-sm"
                                  : "bg-surface-pearl text-ink-muted-80 hover:bg-slate-200 border border-hairline"
                              }`}
                            >
                              Tất cả các lớp ({assignmentsList.length})
                              <span className="ml-1 text-[10px] opacity-80">({submissionsList.length} nộp)</span>
                            </button>

                            {assignmentsList.map((a) => {
                              const classSubs = submissionsList.filter((s) => s.classId === a.classId || (s.classIds && s.classIds.includes(a.classId)));
                              const classAvg = classSubs.length > 0
                                ? (classSubs.reduce((acc, s) => acc + Number(s.score), 0) / classSubs.length).toFixed(1)
                                : "N/A";

                              return (
                                <button
                                  key={a.classId}
                                  type="button"
                                  onClick={() => setSelectedClassTab(a.classId)}
                                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    selectedClassTab === a.classId
                                      ? "bg-primary text-white shadow-sm"
                                      : "bg-surface-pearl text-ink-muted-80 hover:bg-slate-200 border border-hairline"
                                  }`}
                                >
                                  Lớp {a.className}
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/30 text-ink">
                                    {a.studentCount > 0 ? `${classSubs.length}/${a.studentCount}` : classSubs.length} nộp • ĐTB: {classAvg}
                                  </span>
                                </button>
                              );
                            })}

                            {freeSubmissions.length > 0 && (() => {
                              const freeAvg = (freeSubmissions.reduce((acc, s) => acc + Number(s.score), 0) / freeSubmissions.length).toFixed(1);
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedClassTab("UNASSIGNED")}
                                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    selectedClassTab === "UNASSIGNED"
                                      ? "bg-amber-600 text-white shadow-sm"
                                      : "bg-surface-pearl text-ink-muted-80 hover:bg-slate-200 border border-hairline"
                                  }`}
                                >
                                  🌐 Tự do (Thi thử)
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/30 text-ink">
                                    {freeSubmissions.length} nộp • ĐTB: {freeAvg}
                                  </span>
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {submissionsList.length === 0 && (
                        <div className="text-center py-10 border border-dashed border-divider rounded-xl bg-surface-pearl/50 flex flex-col items-center gap-2">
                          <Award className="h-12 w-12 text-ink-muted-48 mb-1" />
                          <span className="text-sm font-bold text-ink">Chưa có lượt nộp bài nào</span>
                          <span className="text-xs text-ink-muted-48">Học sinh chưa thực hiện bài kiểm tra này, nhưng các tab lớp đã được hiển thị theo phân công đề.</span>
                        </div>
                      )}

                      {/* Phổ điểm Tier Breakdown */}
                      <div className="bg-surface-pearl border border-hairline rounded-xl p-4 flex flex-col gap-3">
                        <span className="text-xs font-bold text-ink">Phân bố phổ điểm:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                            <span className="font-semibold text-emerald-800">Giỏi (≥ 8.0)</span>
                            <span className="text-lg font-bold text-emerald-900">{gioicount} HS ({totalSubmissions > 0 ? ((gioicount / totalSubmissions) * 100).toFixed(0) : 0}%)</span>
                          </div>
                          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                            <span className="font-semibold text-blue-800">Khá (6.5 - 7.9)</span>
                            <span className="text-lg font-bold text-blue-900">{khaCount} HS ({totalSubmissions > 0 ? ((khaCount / totalSubmissions) * 100).toFixed(0) : 0}%)</span>
                          </div>
                          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                            <span className="font-semibold text-amber-800">Trung bình (5.0 - 6.4)</span>
                            <span className="text-lg font-bold text-amber-900">{tbCount} HS ({totalSubmissions > 0 ? ((tbCount / totalSubmissions) * 100).toFixed(0) : 0}%)</span>
                          </div>
                          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-red-50 border border-red-100">
                            <span className="font-semibold text-red-800">Yếu (&lt; 5.0)</span>
                            <span className="text-lg font-bold text-red-900">{yeuCount} HS ({totalSubmissions > 0 ? ((yeuCount / totalSubmissions) * 100).toFixed(0) : 0}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Submissions Table */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-ink">
                          Danh sách học sinh nộp bài ({filteredSubmissions.length} lượt):
                        </span>
                        <div className="border border-hairline rounded-xl overflow-x-auto bg-canvas shadow-xs">
                          <table className="w-full min-w-[620px] text-left text-xs font-body border-collapse">
                            <thead>
                              <tr className="bg-surface-pearl text-ink-muted-80 border-b border-divider font-semibold text-[10px] uppercase tracking-wider">
                                <th className="p-3">Họ và Tên</th>
                                <th className="p-3">Lớp học</th>
                                <th className="p-3 text-center">Điểm số</th>
                                <th className="p-3 text-center">Kết quả</th>
                                <th className="p-3 text-right">Thời gian nộp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-divider-soft">
                              {filteredSubmissions.map((s) => {
                                const isPassed = Number(s.score) >= passingScore;
                                return (
                                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-bold text-ink">{s.candidateName}</td>
                                    <td className="p-3 text-ink-muted-80 font-medium">{s.classes}</td>
                                    <td className="p-3 text-center">
                                      <span
                                        className={`font-bold px-2.5 py-1 rounded text-xs inline-block ${
                                          isPassed
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-red-50 text-red-700 border border-red-200"
                                        }`}
                                      >
                                        {Number(s.score).toFixed(1)} / 10.0
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      {isPassed ? (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                          ĐẠT
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                          CHƯA ĐẠT
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right text-ink-muted-48 text-[11px]">
                                      {new Date(s.submittedAt).toLocaleString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="border-t border-divider p-4 bg-surface-pearl flex justify-end">
              <button
                onClick={() => setIsSubmissionsOpen(false)}
                className="bg-primary hover:bg-primary-focus text-white px-6 py-2 rounded-full text-xs font-semibold shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Links Modal */}
      {shareModalQuiz && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-canvas border border-hairline rounded-2xl shadow-xl w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden animate-scale-up">
            <div className="flex justify-between items-start gap-3 border-b border-divider p-4 sm:p-5 flex-shrink-0">
              <h3 className="font-tagline text-base sm:text-lg font-bold text-ink flex items-center gap-2 min-w-0">
                <Share2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">Chia sẻ đường dẫn bài thi</span>
              </h3>
              <button
                onClick={() => {
                  setManualShareClassId("");
                  setShareModalQuiz(null);
                }}
                className="text-ink-muted-48 hover:text-ink transition-colors p-1 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 flex flex-col gap-4 text-xs min-h-0">
              <div>
                <p className="font-semibold text-ink text-sm mb-1 break-words">{shareModalQuiz.title}</p>
                <p className="text-ink-muted-48">Sao chép đường dẫn phù hợp để gửi cho học sinh hoặc chia sẻ công khai.</p>
              </div>

              {/* Link chung */}
              <div className="bg-surface-pearl border border-divider-soft rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                  <span className="font-bold text-ink">🌐 Link chung (Công khai / Mặc định)</span>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/quizzes/${shareModalQuiz.id}`;
                      navigator.clipboard.writeText(url).then(() => {
                        showToast("Đã sao chép link chung vào bộ nhớ tạm!", "success");
                      });
                    }}
                    className="bg-primary hover:bg-primary-focus text-white px-3 py-1.5 rounded-pill font-semibold text-xs transition-colors flex items-center justify-center gap-1 self-start sm:self-auto"
                  >
                    Sao chép link
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/quizzes/${shareModalQuiz.id}` : ""}
                  className="bg-canvas border border-hairline rounded-lg px-3 py-1.5 text-ink-muted-80 font-mono text-[11px] w-full min-w-0"
                />
              </div>

              {/* Links theo từng lớp được gán hoặc tất cả các lớp trong hệ thống */}
              <div className="flex flex-col gap-2.5 min-h-0">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-ink text-xs">🏫 Link riêng cho từng lớp (Tự động ghi nhận lớp học):</span>
                  <span className="text-[11px] text-ink-muted-48">
                    {shareModalQuiz.isPublic
                      ? "Đề công khai vẫn được gom link theo từng lớp để thống kê kết quả đúng tab lớp."
                      : "Đề nội bộ chỉ hiển thị các lớp đã gán trong QuizClassAssignment."}
                  </span>
                </div>

                {(() => {
                  const targetClasses = getShareTargetClasses(shareModalQuiz);

                  if (targetClasses.length === 0) {
                    return (
                      <span className="text-xs text-ink-muted-48 italic">Chưa có dữ liệu lớp học trong hệ thống.</span>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-2.5 max-h-[42dvh] overflow-y-auto pr-1">
                      {targetClasses.map((c) => {
                        const classUrl = typeof window !== "undefined" ? `${window.location.origin}/quizzes/${shareModalQuiz.id}?classId=${c.classId}` : "";
                        return (
                          <div key={c.classId} className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-3 flex flex-col gap-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                              <span className="font-semibold text-primary break-words">Lớp {c.className}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(classUrl).then(
                                    () => showToast(`Đã sao chép link dành riêng cho lớp ${c.className}!`, "success"),
                                    () => showToast("Không thể sao chép tự động. Vui lòng sao chép thủ công.", "error")
                                  );
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-pill font-semibold text-[11px] transition-colors self-start sm:self-auto"
                              >
                                Sao chép link lớp
                              </button>
                            </div>
                            <input
                              type="text"
                              readOnly
                              value={classUrl}
                              className="bg-canvas border border-hairline rounded-lg px-3 py-1 text-ink-muted-80 font-mono text-[11px] w-full min-w-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="border-t border-divider p-3 sm:p-4 flex justify-end flex-shrink-0">
              <button
                onClick={() => {
                  setManualShareClassId("");
                  setShareModalQuiz(null);
                }}
                className="bg-surface-pearl hover:bg-slate-200 text-ink px-5 py-2 rounded-full font-semibold text-xs border border-hairline transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
