/**
 * Quiz shuffle & grading — logic thuần (không đụng DB) cho "mã đề xáo trộn".
 *
 * Server là nguồn chân lý cho thứ tự:
 *  - generatePaper: tạo layout xáo trộn (thứ tự câu từng PHẦN + hoán vị đáp án
 *    từng câu) và trả paperQuestions (câu theo thứ tự hiển thị, KHÔNG chứa
 *    correctAnswer/explanation để không rò rỉ vào bundle).
 *  - gradeWithLayout: map đáp án học sinh (display space) → original rồi chấm
 *    so với correctAnswer chuẩn. Kết quả trả về correctAnswers trong display
 *    space để màn review hiện có chạy không đổi.
 *
 * Mọi hàm đều thuần → unit test không cần DB.
 */

export interface ShuffleQuestion {
  id: string;
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
  score: number;
  explanation?: string | null;
  imageUrl?: string | null;
}

export interface PaperQuestion {
  id: string;
  text: string;
  type: string;
  options: string[];
  score: number;
  imageUrl?: string | null;
}

/** questionOrder: { TYPE: [qid theo thứ tự hiển thị] }, optionOrder: { qid: [hoán vị index đáp án] } */
export interface QuizLayout {
  questionOrder: Record<string, string[]>;
  optionOrder: Record<string, number[]>;
}

export interface GeneratedPaper {
  layout: QuizLayout;
  paperQuestions: PaperQuestion[];
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Hoán vị ngẫu nhiên 0..n-1 (Fisher–Yates). */
export function buildPermutation(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Xáo trộn mảng (bất biến — trả mảng mới). */
export function shuffleArray<T>(arr: T[]): T[] {
  const perm = buildPermutation(arr.length);
  return perm.map((i) => arr[i]);
}

/** Mã đề ngắn 4 ký tự (a-z0-9), VD "ab12". Uniqueness được đảm bảo bằng vòng lặp + unique index. */
export function generateExamCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

function identityPermutation(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * Tạo layout + paper từ danh sách câu hỏi gốc.
 * - Thứ tự PHẦN I→II→III (MULTIPLE_CHOICE → TRUE_FALSE → SHORT_ANSWER) giữ nguyên.
 * - shuffleQuestions=true: xáo thứ tự câu trong từng phần + hoán vị đáp án từng câu.
 * - shuffleQuestions=false: identity (paper = thứ tự gốc).
 */
export function generatePaper(questions: ShuffleQuestion[], shuffleQuestions: boolean): GeneratedPaper {
  const TYPE_ORDER = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"];
  const questionOrder: Record<string, string[]> = {};
  const optionOrder: Record<string, number[]> = {};

  // Gom câu theo type, giữ thứ tự PHẦN I→II→III
  for (const type of TYPE_ORDER) {
    const typeQuestions = questions.filter((q) => q.type === type);
    if (typeQuestions.length === 0) continue;

    const ordered = shuffleQuestions ? shuffleArray(typeQuestions) : typeQuestions;
    questionOrder[type] = ordered.map((q) => q.id);
  }

  // Xử lý từng câu theo thứ tự hiển thị
  const paperQuestions: PaperQuestion[] = [];
  for (const type of TYPE_ORDER) {
    const qids = questionOrder[type] || [];
    for (const qid of qids) {
      const q = questions.find((x) => x.id === qid)!;
      const originalOptions = Array.isArray(q.options) ? q.options : [];
      const n = originalOptions.length;

      if (shuffleQuestions && n > 1) {
        const perm = buildPermutation(n);
        optionOrder[q.id] = perm;
        paperQuestions.push({
          id: q.id,
          text: q.text,
          type: q.type,
          options: perm.map((i) => originalOptions[i]),
          score: q.score,
          imageUrl: q.imageUrl ?? null,
        });
      } else {
        optionOrder[q.id] = identityPermutation(n);
        paperQuestions.push({
          id: q.id,
          text: q.text,
          type: q.type,
          options: [...originalOptions],
          score: q.score,
          imageUrl: q.imageUrl ?? null,
        });
      }
    }
  }

  return { layout: { questionOrder, optionOrder }, paperQuestions };
}

/** Hết giờ chưa? (thu bài tự động) */
export function isOverdue(endsAt: Date | string, now: Date = new Date()): boolean {
  return now.getTime() > new Date(endsAt).getTime();
}

interface GradeInputQuestion {
  id: string;
  type: string;
  correctAnswer: string;
  score: number;
  explanation?: string | null;
}

/**
 * Chấm bài theo layout (display → original).
 * `answers`: map questionId → đáp án học sinh theo DISPLAY space.
 * Trả về `correctAnswers` trong DISPLAY space để màn review hiện có chạy không đổi.
 */
export function gradeWithLayout(
  questionsById: Record<string, GradeInputQuestion>,
  layout: QuizLayout,
  answers: Record<string, string>,
): { totalScore: number; maxScore: number; correctAnswers: { id: string; correctAnswer: string; explanation: string | null }[] } {
  const optionOrder = layout.optionOrder || {};
  let totalScore = 0;
  let maxScore = 0;
  const correctAnswers: { id: string; correctAnswer: string; explanation: string | null }[] = [];

  for (const qid of Object.keys(questionsById)) {
    const q = questionsById[qid];
    const studentAnswer = (answers[qid] || "").trim().toUpperCase();
    const correctAnswer = (q.correctAnswer || "").trim().toUpperCase();
    const perm = optionOrder[qid] || identityPermutation(0);
    maxScore += q.score;

    // correctAnswers trả về display space
    const displayCorrect = mapCorrectToDisplay(q, correctAnswer, perm);

    let earned = 0;
    if (q.type === "TRUE_FALSE") {
      const studentParts = studentAnswer.split(",");
      const correctParts = displayCorrect.split(",");
      let subCorrect = 0;
      for (let i = 0; i < Math.min(studentParts.length, correctParts.length); i++) {
        if (studentParts[i] && correctParts[i] && studentParts[i].trim() === correctParts[i].trim()) {
          subCorrect++;
        }
      }
      let scoreRatio = 0;
      if (subCorrect === 1) scoreRatio = 0.1;
      else if (subCorrect === 2) scoreRatio = 0.25;
      else if (subCorrect === 3) scoreRatio = 0.5;
      else if (subCorrect === 4) scoreRatio = 1.0;
      earned = scoreRatio * q.score;
    } else {
      if (studentAnswer === displayCorrect) {
        earned = q.score;
      }
    }
    totalScore += earned;

    correctAnswers.push({
      id: qid,
      correctAnswer: displayCorrect,
      explanation: q.explanation ?? null,
    });
  }

  return { totalScore, maxScore, correctAnswers };
}

/** Chuyển đáp án chuẩn (original space) → display space cho correctAnswers trả về client. */
function mapCorrectToDisplay(q: GradeInputQuestion, correctAnswer: string, perm: number[]): string {
  if (q.type === "TRUE_FALSE") {
    // correctAnswer "T,T,T,T" → hoán vị theo perm (display order)
    const originalParts = correctAnswer.split(",");
    const displayParts = perm.map((i) => originalParts[i] || "F");
    return displayParts.join(",");
  }
  // MULTIPLE_CHOICE: correctAnswer là index gốc → vị trí display = perm.indexOf(correctIdx)
  const correctIdx = Number(correctAnswer);
  if (!isNaN(correctIdx) && perm.length > 0) {
    const displayIdx = perm.indexOf(correctIdx);
    if (displayIdx >= 0) return String(displayIdx);
  }
  // SHORT_ANSWER (hoặc không phải index): giữ nguyên chuỗi
  return correctAnswer;
}
