export type QuizQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface RawQuestion {
  questionText?: unknown;
  text?: unknown;
  type?: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  answer?: unknown;
  score?: unknown;
  explanation?: unknown;
  imageUrl?: unknown;
  // Cấu trúc mã đề part_1/part_2/part_3 (đề thi tiếng Anh, ...)
  part_1?: unknown;
  part_2?: unknown;
  part_3?: unknown;
  [key: string]: unknown;
}

export interface NormalizedQuestion {
  questionText: string;
  type: QuizQuestionType;
  options: string[];
  correctAnswer: string;
  score: number;
  explanation?: string;
  imageUrl?: string;
}

type AnyRecord = Record<string, unknown>;

function isObject(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Phát hiện & làm phẳng cấu trúc mã đề { part_1, part_2, part_3 } thành mảng câu hỏi
function flattenExamParts(raw: unknown[]): AnyRecord[] {
  const first = raw[0];
  if (!isObject(first) || !(first.part_1 || first.part_2 || first.part_3)) return raw as AnyRecord[];

  const flat: AnyRecord[] = [];
  const letterMap: Record<string, string> = { A: "0", B: "1", C: "2", D: "3" };

  for (const exam of raw) {
    if (!isObject(exam)) continue;

    if (Array.isArray(exam.part_1)) {
      for (const q of exam.part_1 as AnyRecord[]) {
        if (!isObject(q)) continue;
        const opts = q.options && isObject(q.options)
          ? [String(q.options.A ?? ""), String(q.options.B ?? ""), String(q.options.C ?? ""), String(q.options.D ?? "")]
          : [];
        flat.push({
          questionText: String(q.question_text ?? ""),
          type: "MULTIPLE_CHOICE",
          options: opts,
          correctAnswer: letterMap[String(q.correct_answer ?? "").toUpperCase()] ?? "0",
          score: 0.25,
          explanation: String(q.explanation ?? ""),
          imageUrl: "",
        });
      }
    }

    if (Array.isArray(exam.part_2)) {
      for (const q of exam.part_2 as AnyRecord[]) {
        if (!isObject(q)) continue;
        const statements = Array.isArray(q.statements) ? (q.statements as AnyRecord[]) : [];
        flat.push({
          questionText: String(q.context ?? ""),
          type: "TRUE_FALSE",
          options: statements.map((s) => String(s.statement ?? "")),
          correctAnswer: statements.map((s) => (s.is_correct ? "T" : "F")).join(",") || "",
          score: 1.0,
          explanation: String(q.explanation ?? ""),
          imageUrl: "",
        });
      }
    }

    if (Array.isArray(exam.part_3)) {
      for (const q of exam.part_3 as AnyRecord[]) {
        if (!isObject(q)) continue;
        flat.push({
          questionText: String(q.question_text ?? ""),
          type: "SHORT_ANSWER",
          options: [],
          correctAnswer: String(q.answer ?? ""),
          score: 0.5,
          explanation: String(q.explanation ?? ""),
          imageUrl: "",
        });
      }
    }
  }

  return flat;
}

function normalizeOne(q: AnyRecord): NormalizedQuestion {
  const type: QuizQuestionType =
    q.type === "TRUE_FALSE" || q.type === "SHORT_ANSWER" || q.type === "MULTIPLE_CHOICE"
      ? q.type
      : "MULTIPLE_CHOICE";

  const rawOptions = Array.isArray(q.options) ? (q.options as unknown[]).map((o) => String(o ?? "")) : [];
  const correctAnswer =
    q.correctAnswer !== undefined
      ? q.correctAnswer
      : q.answer !== undefined
        ? q.answer
        : "";

  if (type === "SHORT_ANSWER") {
    return {
      questionText: String(q.questionText ?? q.text ?? ""),
      type,
      options: [],
      correctAnswer: String(correctAnswer).trim(),
      score: parseFloat(String(q.score)) || 0.5,
      explanation: q.explanation ? String(q.explanation) : undefined,
      imageUrl: q.imageUrl ? String(q.imageUrl) : undefined,
    };
  }

  let options = [...rawOptions];
  while (options.length < 4) options.push("");
  options = options.slice(0, 4);

  let normalizedAnswer = String(correctAnswer).trim();
  if (type === "MULTIPLE_CHOICE") {
    if (!normalizedAnswer || isNaN(Number(normalizedAnswer))) normalizedAnswer = "0";
  } else if (type === "TRUE_FALSE") {
    if (!normalizedAnswer || !normalizedAnswer.includes(",")) normalizedAnswer = "T,T,T,T";
  }

  return {
    questionText: String(q.questionText ?? q.text ?? ""),
    type,
    options,
    correctAnswer: normalizedAnswer,
    score: parseFloat(String(q.score)) || 1.0,
    explanation: q.explanation ? String(q.explanation) : undefined,
    imageUrl: q.imageUrl ? String(q.imageUrl) : undefined,
  };
}

// Chuẩn hoá mảng câu hỏi thô (từ JSON import hoặc kết quả AI) về shape đồng nhất
// khớp với state `questions` của form tạo đề. Bỏ qua phần tử không hợp lệ.
export function normalizeQuestions(raw: unknown): NormalizedQuestion[] {
  if (!Array.isArray(raw)) return [];
  const flattened = flattenExamParts(raw);
  return flattened
    .filter((q): q is AnyRecord => isObject(q))
    .map(normalizeOne)
    .filter((q) => q.questionText.trim().length > 0);
}
