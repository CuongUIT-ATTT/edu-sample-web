import { describe, it, expect } from "vitest";
import {
  buildPermutation,
  shuffleArray,
  generatePaper,
  generateExamCode,
  gradeWithLayout,
  isOverdue,
  type ShuffleQuestion,
  type QuizLayout,
} from "../quiz-shuffle";

const QUESTIONS: ShuffleQuestion[] = [
  { id: "mc1", text: "MC 1", type: "MULTIPLE_CHOICE", options: ["A", "B", "C", "D"], correctAnswer: "2", score: 1, explanation: "mc1 exp" },
  { id: "mc2", text: "MC 2", type: "MULTIPLE_CHOICE", options: ["A", "B", "C", "D"], correctAnswer: "0", score: 1, explanation: "mc2 exp" },
  { id: "tf1", text: "TF 1", type: "TRUE_FALSE", options: ["st1", "st2", "st3", "st4"], correctAnswer: "T,F,T,T", score: 1, explanation: "tf1 exp" },
  { id: "sa1", text: "SA 1", type: "SHORT_ANSWER", options: [], correctAnswer: "8", score: 1, explanation: "sa1 exp" },
];

describe("buildPermutation", () => {
  it("trả hoán vị hợp lệ của 0..n-1", () => {
    const perm = buildPermutation(5);
    expect([...perm].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    expect(perm.length).toBe(5);
  });

  it("hoán vị n=1 là [0]", () => {
    expect(buildPermutation(1)).toEqual([0]);
  });
});

describe("shuffleArray", () => {
  it("trả mảng mới cùng phần tử (không mutate)", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    // không mutate mảng gốc
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("generateExamCode", () => {
  it("sinh mã 4 ký tự a-z0-9", () => {
    const code = generateExamCode();
    expect(code).toMatch(/^[a-z0-9]{4}$/);
  });
});

describe("generatePaper", () => {
  it("shuffleQuestions=false → thứ tự gốc (identity)", () => {
    const { layout, paperQuestions } = generatePaper(QUESTIONS, false);
    // Thứ tự câu giữ nguyên theo PHẦN
    expect(paperQuestions.map((q) => q.id)).toEqual(["mc1", "mc2", "tf1", "sa1"]);
    // optionOrder identity
    expect(layout.optionOrder["mc1"]).toEqual([0, 1, 2, 3]);
    expect(layout.optionOrder["tf1"]).toEqual([0, 1, 2, 3]);
    // paper không chứa correctAnswer/explanation
    expect(paperQuestions[0]).not.toHaveProperty("correctAnswer");
    expect(paperQuestions[0]).not.toHaveProperty("explanation");
  });

  it("shuffleQuestions=true → đủ số câu, không chứa correctAnswer, optionOrder đúng độ dài", () => {
    const { layout, paperQuestions } = generatePaper(QUESTIONS, true);
    expect(paperQuestions.length).toBe(4);
    expect(paperQuestions.map((q) => q.id).sort()).toEqual(["mc1", "mc2", "sa1", "tf1"]);
    // Thứ tự type giữ PHẦN I→II→III (tất cả MCQ trước TF trước SA)
    const typeOrder = paperQuestions.map((q) => q.type);
    expect(typeOrder).toEqual(["MULTIPLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]);
    for (const q of paperQuestions) {
      expect(q).not.toHaveProperty("correctAnswer");
      expect(q).not.toHaveProperty("explanation");
    }
    expect(layout.optionOrder["mc1"].length).toBe(4);
    expect(layout.optionOrder["tf1"].length).toBe(4);
    // optionOrder là hoán vị (chỉ với câu có options; sa1 không có options → [])
    for (const key of ["mc1", "mc2", "tf1"]) {
      const perm = layout.optionOrder[key];
      expect([...perm].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    }
    expect(layout.optionOrder["sa1"]).toEqual([]);
  });

  it("giữ nguyên imageUrl trong paper", () => {
    const withImg = [{ ...QUESTIONS[0], imageUrl: "https://img.example/a.png" }];
    const { paperQuestions } = generatePaper(withImg, false);
    expect(paperQuestions[0].imageUrl).toBe("https://img.example/a.png");
  });
});

describe("gradeWithLayout", () => {
  const questionsById: Record<string, { id: string; type: string; correctAnswer: string; score: number; explanation: string | null }> = {
    mc1: { id: "mc1", type: "MULTIPLE_CHOICE", correctAnswer: "2", score: 1, explanation: "mc1 exp" },
    mc2: { id: "mc2", type: "MULTIPLE_CHOICE", correctAnswer: "0", score: 1, explanation: "mc2 exp" },
    tf1: { id: "tf1", type: "TRUE_FALSE", correctAnswer: "T,F,T,T", score: 1, explanation: "tf1 exp" },
    sa1: { id: "sa1", type: "SHORT_ANSWER", correctAnswer: "8", score: 1, explanation: "sa1 exp" },
  };

  // Identity layout
  const identityLayout: QuizLayout = {
    questionOrder: { MULTIPLE_CHOICE: ["mc1", "mc2"], TRUE_FALSE: ["tf1"], SHORT_ANSWER: ["sa1"] },
    optionOrder: { mc1: [0, 1, 2, 3], mc2: [0, 1, 2, 3], tf1: [0, 1, 2, 3], sa1: [0] },
  };

  it("chấm đúng với layout identity", () => {
    const res = gradeWithLayout(questionsById, identityLayout, {
      mc1: "2",
      mc2: "0",
      tf1: "T,F,T,T",
      sa1: "8",
    });
    expect(res.totalScore).toBe(4);
    expect(res.maxScore).toBe(4);
    // correctAnswers trả display space (identity = original)
    expect(res.correctAnswers.find((c) => c.id === "mc1")?.correctAnswer).toBe("2");
    expect(res.correctAnswers.find((c) => c.id === "tf1")?.correctAnswer).toBe("T,F,T,T");
  });

  it("chấm sai → 0 điểm câu đó", () => {
    const res = gradeWithLayout(questionsById, identityLayout, { mc1: "1" });
    expect(res.totalScore).toBe(0);
  });

  it("TRUE_FALSE partial credit (1/4 ý = 0.1 điểm)", () => {
    // correct T,F,T,T. Student T,T,F,F → chỉ pos0 đúng = 1/4
    const res = gradeWithLayout(questionsById, identityLayout, { tf1: "T,T,F,F" });
    expect(res.totalScore).toBe(0.1);
  });

  it("layout hoán vị: student chọn theo display space → map đúng original", () => {
    // mc1 correct=2 (original). Hoán vị [3,0,1,2] → display: options = [D,A,B,C].
    // Đáp án đúng display = index of 2 trong [3,0,1,2] = 3.
    const layout: QuizLayout = {
      questionOrder: { MULTIPLE_CHOICE: ["mc1"] },
      optionOrder: { mc1: [3, 0, 1, 2], sa1: [0] },
    };
    const res = gradeWithLayout(questionsById, layout, { mc1: "3" }); // student chọn display 3
    expect(res.totalScore).toBe(1);
    // correctAnswers trả display space = 3
    expect(res.correctAnswers.find((c) => c.id === "mc1")?.correctAnswer).toBe("3");
  });

  it("TRUE_FALSE hoán vị: student đáp theo display → đúng", () => {
    // tf1 correct="T,F,T,T" (original). Hoán vị [2,0,3,1]:
    //   display stmt0 = original stmt2 = T
    //   display stmt1 = original stmt0 = T
    //   display stmt2 = original stmt3 = T
    //   display stmt3 = original stmt1 = F
    //   → display correct = "T,T,T,F"
    const layout: QuizLayout = {
      questionOrder: { TRUE_FALSE: ["tf1"] },
      optionOrder: { tf1: [2, 0, 3, 1] },
    };
    const res = gradeWithLayout(questionsById, layout, { tf1: "T,T,T,F" });
    expect(res.totalScore).toBe(1);
    expect(res.correctAnswers.find((c) => c.id === "tf1")?.correctAnswer).toBe("T,T,T,F");
  });

  it("consistency: score qua layout = score chấm chuẩn khi không xáo", () => {
    const resLayout = gradeWithLayout(questionsById, identityLayout, { mc1: "2", mc2: "0", tf1: "T,F,T,T", sa1: "8" });
    const resStd = gradeWithLayout(questionsById, identityLayout, { mc1: "2", mc2: "0", tf1: "T,F,T,T", sa1: "8" });
    expect(resLayout.totalScore).toBe(resStd.totalScore);
  });
});

describe("isOverdue", () => {
  it("endsAt trong quá khứ → true", () => {
    expect(isOverdue(new Date(Date.now() - 1000))).toBe(true);
  });

  it("endsAt trong tương lai → false", () => {
    expect(isOverdue(new Date(Date.now() + 100000))).toBe(false);
  });
});
