/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { BookOpen, Clock, Award, Plus, Trash2, X, PlusCircle, CheckCircle, AlertCircle, HelpCircle, FileText, Upload, Share2, Edit3, Loader2, UserCheck, BarChart2, ImagePlus, Image as ImageIcon } from "lucide-react";
import { createQuiz, deleteQuiz, updateQuiz, getQuizSubmissions } from "@/actions/quizzes";
import MathRenderer from "@/components/MathRenderer";
import { showToast } from "@/components/Toast";

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  duration: number;
  passingScore: number;
  isPublic?: boolean;
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

export default function TeacherQuizManager({ quizzes, subjects, classes, isAdmin = false }: TeacherQuizManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const imageFileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Submissions modal state
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState("");
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const handleViewSubmissions = async (quizId: string, quizTitle: string) => {
    setSelectedQuizTitle(quizTitle);
    setIsSubmissionsOpen(true);
    setLoadingSubmissions(true);
    setSubmissionsList([]);

    try {
      const res = await getQuizSubmissions(quizId);
      if (res.success && res.data) {
        setSubmissionsList(res.data);
      } else {
        alert(res.error || "Không thể tải danh sách kết quả.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi hệ thống khi tải kết quả.");
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
  const [classId, setClassId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showOnList, setShowOnList] = useState(true);
  const [answerVisibility, setAnswerVisibility] = useState("IMMEDIATELY");
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  
  // Custom type toggle inside form
  const [importMethod, setImportMethod] = useState<"MANUAL" | "PASTE_TEXT" | "CSV" | "JSON">("MANUAL");
  const [rawPastedText, setRawPastedText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [imageJsonText, setImageJsonText] = useState("");
  const [importingImages, setImportingImages] = useState(false);

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

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: "0", score: 0.25, explanation: "", imageUrl: "" }]);
  };

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

  const downloadCsvTemplate = () => {
    const headers = "QuestionText,Type,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Score\n";
    const row1 = "\"Tim tap xac dinh cua ham so $y=\\log(x-3)$\",\"MULTIPLE_CHOICE\",\"$D=(3; +\\infty)$\",\"$D=[3; +\\infty)$\",\"$D=(-\\infty; 3)$\",\"$D=\\mathbb{R}$\",\"0\",\"1.0\"\n";
    const row2 = "\"Phat bieu nao dung ve ham so bac hai?\",\"TRUE_FALSE\",\"Do thi la Parabol\",\"Co dinh la $(-b/2a; -\\Delta/4a)$\",\"Cat truc tung tai (0;c)\",\"Luon dong bien tren R\",\"T,T,T,F\",\"2.0\"\n";
    const row3 = "\"Tim nghiem cua phuong trinh $\\log_2(x) = 3$\",\"SHORT_ANSWER\",\"\",\"\",\"\",\"\",\"8\",\"1.0\"\n";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2 + row3);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "mau_cau_hoi_THPT_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const downloadImageJsonTemplate = () => {
    const imageTemplate = {
      "question_1": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "question_5": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(imageTemplate, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", "mau_anh_de_thi.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n");
      const parsedQuestions = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = [];
        let current = "";
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        cells.push(current.trim());

        if (cells.length >= 8) {
          const type = (cells[1].replace(/^"|"$/g, "").toUpperCase()) as any;
          const qType = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"].includes(type) ? type : "MULTIPLE_CHOICE";
          
          parsedQuestions.push({
            questionText: cells[0].replace(/^"|"$/g, "").replace(/""/g, '"'),
            type: qType,
            options: qType === "SHORT_ANSWER" ? [] : [
              cells[2].replace(/^"|"$/g, "").replace(/""/g, '"'),
              cells[3].replace(/^"|"$/g, "").replace(/""/g, '"'),
              cells[4].replace(/^"|"$/g, "").replace(/""/g, '"'),
              cells[5].replace(/^"|"$/g, "").replace(/""/g, '"'),
            ],
            correctAnswer: cells[6].replace(/^"|"$/g, ""),
            score: parseFloat(cells[7]) || 1.0,
          });
        }
      }

      if (parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
        showToast(`Đã tải thành công ${parsedQuestions.length} câu hỏi từ file CSV! Hãy xem lại chi tiết ở phía dưới.`, "success");
      } else {
        showToast("Không tìm thấy dòng câu hỏi hợp lệ trong file CSV.", "error");
      }
    };
    reader.readAsText(file, "UTF-8");
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

      // Upload từng ảnh lên ImgBB
      const IMGBB_KEY = "1e76aab065ef1f9c93204720c9bd4038";
      const urlMap: Record<number, string> = {};

      await Promise.all(
        imageEntries.map(async ([qNum, src]) => {
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

            const form = new FormData();
            form.append("key", IMGBB_KEY);
            form.append("image", imgData);

            const res = await fetch("https://api.imgbb.com/1/upload", {
              method: "POST",
              body: form,
              signal: AbortSignal.timeout(30000),
            });
            const json = await res.json();
            if (json.data?.url) {
              urlMap[qNum] = json.data.url;
            }
          } catch (e) {
            console.error(`ImgBB upload failed for question_${qNum}:`, e);
          }
        })
      );

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

      const formattedQuestions = parsed.map((q: any) => {
        const type = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"].includes(q.type) ? q.type : "MULTIPLE_CHOICE";
        let options = Array.isArray(q.options) ? [...q.options] : [];
        let correctAnswer = (q.correctAnswer !== undefined ? q.correctAnswer : q.answer !== undefined ? q.answer : "").toString().trim();

        if (type === "MULTIPLE_CHOICE") {
          while (options.length < 4) options.push("");
          options = options.slice(0, 4);
          if (!correctAnswer || isNaN(Number(correctAnswer))) {
            correctAnswer = "0";
          }
        } else if (type === "TRUE_FALSE") {
          while (options.length < 4) options.push("");
          options = options.slice(0, 4);
          if (!correctAnswer || !correctAnswer.includes(",")) {
            correctAnswer = "T,T,T,T";
          }
        } else if (type === "SHORT_ANSWER") {
          options = [];
        }

        return {
          questionText: q.questionText || q.text || "",
          type,
          options,
          correctAnswer,
          score: parseFloat(q.score) || 1.0,
          explanation: q.explanation || q.explain || "",
          imageUrl: q.imageUrl || q.image || ""
        };
      });

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

  // AI Paste text parser - Free parsing!
  const parsePastedText = () => {
    if (!rawPastedText.trim()) {
      showToast("Vui lòng dán nội dung câu hỏi/đề thi vào ô văn bản.", "warning");
      return;
    }

    const lines = rawPastedText.split("\n");
    const parsed: typeof questions = [];
    let currentQ: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const qMatch = line.match(/^(?:Câu|Cau|Question)\s*(\d+)\s*[:.]\s*(.*)$/i);
      if (qMatch) {
        if (currentQ) {
          finalizeQuestion(currentQ);
          parsed.push(currentQ);
        }
        currentQ = {
          questionText: qMatch[2].trim(),
          type: "MULTIPLE_CHOICE",
          options: [],
          correctAnswer: "0",
          score: 1.0
        };
        continue;
      }

      const optMatch = line.match(/^([A-D])\s*[:.)-]\s*(.*)$/i);
      if (optMatch && currentQ) {
        currentQ.options.push(optMatch[2].trim());
        continue;
      }

      const tfMatch = line.match(/^([a-d])\s*[:.)-]\s*(.*)$/i);
      if (tfMatch && currentQ) {
        currentQ.type = "TRUE_FALSE";
        currentQ.options.push(tfMatch[2].trim());
        continue;
      }

      const ansMatch = line.match(/^(?:Đáp án|Dap an|Chọn|Chon|Answer)\s*[:.]?\s*(.*)$/i);
      if (ansMatch && currentQ) {
        const val = ansMatch[1].trim().toUpperCase();
        if (val === "A" || val === "B" || val === "C" || val === "D") {
          currentQ.correctAnswer = (val.charCodeAt(0) - 65).toString();
        } else if (val.includes(",") || val === "Đ" || val === "S" || val === "D" || val.startsWith("ĐÚNG") || val.startsWith("SAI") || val.startsWith("T") || val.startsWith("F")) {
          const normalized = val.split(",").map(item => {
            const clean = item.trim();
            return (clean.startsWith("Đ") || clean.startsWith("T") || clean.startsWith("D")) ? "T" : "F";
          }).join(",");
          currentQ.correctAnswer = normalized;
          currentQ.type = "TRUE_FALSE";
        } else {
          currentQ.correctAnswer = val;
          currentQ.type = "SHORT_ANSWER";
        }
        continue;
      }

      if (currentQ) {
        if (currentQ.options.length === 0) {
          currentQ.questionText += " " + line;
        }
      }
    }

    if (currentQ) {
      finalizeQuestion(currentQ);
      parsed.push(currentQ);
    }

    function finalizeQuestion(q: any) {
      if (q.type === "MULTIPLE_CHOICE") {
        while (q.options.length < 4) q.options.push("");
        q.options = q.options.slice(0, 4);
      } else if (q.type === "TRUE_FALSE") {
        while (q.options.length < 4) q.options.push("");
        q.options = q.options.slice(0, 4);
        if (!q.correctAnswer.includes(",")) {
          q.correctAnswer = "T,T,T,T";
        }
      } else if (q.type === "SHORT_ANSWER") {
        q.options = [];
      }
    }

    if (parsed.length > 0) {
      setQuestions(parsed);
      showToast(`Phân tích thành công ${parsed.length} câu hỏi tự động từ văn bản! Bạn có thể xem lại danh sách câu hỏi chi tiết dưới đây.`, "success");
      setRawPastedText("");
    } else {
      showToast("Không bóc tách được câu hỏi nào. Vui lòng kiểm tra lại định dạng câu hỏi (Ví dụ: 'Câu 1: ... A. ... B. ...').", "error");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawPastedText(text);
        showToast("Đã tải dữ liệu file văn bản thành công. Hãy bấm nút 'Phân tích tự động' để quét đề.", "success");
      }
    };
    reader.readAsText(file, "UTF-8");
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
        subjectId,
        classId: classId || undefined,
        isPublic,
        answerVisibility,
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
        subjectId,
        classId: classId || undefined,
        isPublic,
        answerVisibility,
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
    setClassId("");
    setIsPublic(false);
    setShowOnList(true);
    setAnswerVisibility("IMMEDIATELY");
    setQuestions([{ questionText: "", type: "MULTIPLE_CHOICE", options: ["", "", "", ""], correctAnswer: "0", score: 1, explanation: "", imageUrl: "" }]);
    setModalMode("CREATE");
    setEditingQuizId(null);
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
    setClassId(q.class?.id || "");
    setIsPublic(q.isPublic || false);
    setAnswerVisibility(q.answerVisibility || "IMMEDIATELY");
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

  const handleShareClick = (quizId: string) => {
    const url = window.location.origin + "/quizzes/" + quizId;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Đã sao chép đường dẫn chia sẻ đề thi vào bộ nhớ tạm!", "success");
    }).catch(() => {
      showToast("Không thể sao chép link. Hãy copy thủ công đường dẫn: " + url, "error");
    });
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

        {/* Question text & type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2 pr-8">
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

          <div className="flex flex-col gap-1.5">
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
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-primary px-2.5 py-0.5 rounded-full">
                      {q.subject.name}
                    </span>
                    {q.class && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full">
                        Lớp {q.class.name}
                      </span>
                    )}
                    {q.isPublic ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">
                        Công khai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-ink-muted-80 px-2.5 py-0.5 rounded-full">
                        Nội bộ
                      </span>
                    )}
                    <span className="text-xs text-ink-muted-48 font-semibold">{q._count.questions} câu hỏi</span>
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
                    <>
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
                      <div className="flex gap-4 items-center text-[10px] text-primary mt-1 font-body">
                        <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          <UserCheck className="h-3 w-3" />
                          Lượt nộp: {subCount}
                        </span>
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 font-semibold">
                          <BarChart2 className="h-3 w-3" />
                          Điểm TB: {avgScore}đ
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="border-t border-divider-soft pt-4 flex justify-end gap-2 flex-wrap">
                <button
                  onClick={() => handleViewSubmissions(q.id, q.title)}
                  className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Award className="h-3.5 w-3.5" /> Kết quả
                </button>
                <button
                  onClick={() => handleShareClick(q.id)}
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-caption-strong text-ink-muted-80">Lớp học (Tùy chọn)</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  >
                    <option value="">— Tất cả học viên (Mặc định) —</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                    <option value="IMMEDIATELY">Xem đáp án và giải thích ngay sau khi nộp bài</option>
                    <option value="WHEN_ENDED">Xem đáp án và giải thích khi hết thời gian thi (timer = 0)</option>
                    <option value="NEVER">Không cho học viên xem đáp án và giải thích</option>
                  </select>
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
              </div>

              {/* Import Method Toggle Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setImportMethod("MANUAL")}
                  className={`px-4 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                    importMethod === "MANUAL" 
                      ? "bg-primary border-primary text-white shadow-sm" 
                      : "bg-surface-pearl border-divider text-ink-muted-80 hover:bg-canvas"
                  }`}
                >
                  Nhập tay
                </button>
                <button
                  type="button"
                  onClick={() => setImportMethod("PASTE_TEXT")}
                  className={`px-4 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                    importMethod === "PASTE_TEXT" 
                      ? "bg-primary border-primary text-white shadow-sm" 
                      : "bg-surface-pearl border-divider text-ink-muted-80 hover:bg-canvas"
                  }`}
                >
                  Dán đề từ PDF/Word (AI Free)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMethod("CSV")}
                  className={`px-4 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                    importMethod === "CSV" 
                      ? "bg-primary border-primary text-white shadow-sm" 
                      : "bg-surface-pearl border-divider text-ink-muted-80 hover:bg-canvas"
                  }`}
                >
                  Import file CSV
                </button>
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
              </div>

              {/* PASTE TEXT / COPY PASTE AI PARSER */}
              {importMethod === "PASTE_TEXT" && (
                <div className="border border-divider rounded-lg p-4 bg-surface-pearl flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-ink">Dán nội dung đề thi từ file PDF/DOCX</span>
                    <label className="text-xs text-primary hover:underline font-bold cursor-pointer">
                      Tải lên file văn bản/pdf (.txt)
                      <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <textarea
                    rows={6}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder="Mẫu:&#13;Câu 1: Giải phương trình $x^2 - 4 = 0$&#13;A. $x=2$&#13;B. $x=-2$&#13;C. $x=\pm 2$&#13;D. $x=0$&#13;Đáp án: C"
                    className="bg-canvas border border-hairline rounded-lg p-3 text-xs outline-none focus:border-primary-focus w-full"
                  />
                  <button
                    type="button"
                    onClick={parsePastedText}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-pill shadow-sm self-end"
                  >
                    Phân tích đề tự động
                  </button>
                </div>
              )}

              {/* CSV FILE IMPORT */}
              {importMethod === "CSV" && (
                <div className="border border-divider rounded-lg p-4 bg-surface-pearl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-green-600" /> Nhập nhanh từ file CSV
                    </span>
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Tải file CSV mẫu (.csv)
                    </button>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCsv}
                    className="bg-canvas border border-hairline rounded p-2 text-xs w-full"
                  />
                </div>
              )}

              {/* JSON FILE IMPORT */}
              {importMethod === "JSON" && (
                <div className="border border-divider rounded-lg p-4 bg-surface-pearl flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-orange-600" /> Nhập danh sách câu hỏi bằng mã JSON
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={downloadJsonTemplate}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Tải JSON mẫu đề thi
                      </button>
                      <button
                        type="button"
                        onClick={downloadImageJsonTemplate}
                        className="text-xs text-amber-600 hover:underline font-semibold"
                      >
                        Tải JSON mẫu ảnh base64
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

      {/* Submissions Results View Modal */}
      {isSubmissionsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[650px] max-w-full shadow-product flex flex-col overflow-hidden animate-fade-in max-h-[85vh]">
            <div className="border-b border-divider p-5 flex items-center justify-between">
              <div>
                <h3 className="font-tagline text-base font-bold text-ink">Kết quả làm bài thi</h3>
                <p className="text-[10px] text-ink-muted-48">{selectedQuizTitle}</p>
              </div>
              <button
                onClick={() => setIsSubmissionsOpen(false)}
                className="hover:bg-surface-pearl p-1 rounded-full text-ink-muted-80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              {loadingSubmissions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-xs text-ink-muted-80 font-body">Đang tải kết quả thi...</span>
                </div>
              ) : submissionsList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-divider rounded-lg">
                  <Award className="h-10 w-10 text-ink-muted-48 mx-auto mb-2" />
                  <span className="text-xs text-ink-muted-80 font-body">Chưa có lượt nộp bài nào cho đề thi này.</span>
                </div>
              ) : (
                <div className="border border-hairline rounded-lg overflow-x-auto bg-canvas">
                  <table className="w-full min-w-[550px] text-left text-xs font-body border-collapse">
                    <thead>
                      <tr className="bg-surface-pearl text-ink-muted-80 border-b border-divider font-semibold text-[10px] uppercase tracking-wider">
                        <th className="p-3">Họ và Tên</th>
                        <th className="p-3">Lớp học</th>
                        <th className="p-3 text-center">Điểm số</th>
                        <th className="p-3 text-right">Thời gian nộp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider-soft">
                      {submissionsList.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-ink">{s.candidateName}</td>
                          <td className="p-3 text-ink-muted-80">{s.classes}</td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-primary px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-xs">
                              {Number(s.score).toFixed(1)} / 10.0
                            </span>
                          </td>
                          <td className="p-3 text-right text-ink-muted-48 text-[11px]">
                            {new Date(s.submittedAt).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-divider p-4 flex justify-end">
              <button
                onClick={() => setIsSubmissionsOpen(false)}
                className="bg-primary hover:bg-primary-focus text-white px-5 py-2 rounded-pill text-xs font-semibold shadow-sm"
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
