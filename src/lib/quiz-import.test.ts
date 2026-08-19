import { describe, it, expect } from "vitest";
import { normalizeQuestions } from "./quiz-import";

describe("normalizeQuestions", () => {
  it("normalizes basic MULTIPLE_CHOICE with numeric index answer", () => {
    const out = normalizeQuestions([
      { questionText: "2+2?", options: ["3", "4", "5", "6"], correctAnswer: "1", score: 1 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      questionText: "2+2?",
      type: "MULTIPLE_CHOICE",
      options: ["3", "4", "5", "6"],
      correctAnswer: "1",
    });
    expect(out[0].score).toBe(1);
  });

  it("pads options to 4 and defaults answer to 0 when invalid", () => {
    const out = normalizeQuestions([
      { questionText: "Q", options: ["A", "B"], correctAnswer: "Z" },
    ]);
    expect(out[0].options).toHaveLength(4);
    expect(out[0].correctAnswer).toBe("0");
  });

  it("handles TRUE_FALSE with comma answer", () => {
    const out = normalizeQuestions([
      {
        questionText: "Ctx",
        type: "TRUE_FALSE",
        options: ["s1", "s2", "s3", "s4"],
        correctAnswer: "T,F,T,T",
      },
    ]);
    expect(out[0].type).toBe("TRUE_FALSE");
    expect(out[0].correctAnswer).toBe("T,F,T,T");
  });

  it("handles TRUE_FALSE missing answer → defaults T,T,T,T", () => {
    const out = normalizeQuestions([
      { questionText: "Ctx", type: "TRUE_FALSE", options: ["s1", "s2", "s3", "s4"] },
    ]);
    expect(out[0].correctAnswer).toBe("T,T,T,T");
  });

  it("handles SHORT_ANSWER with empty options", () => {
    const out = normalizeQuestions([
      { questionText: "Capital?", type: "SHORT_ANSWER", options: ["x"], correctAnswer: "Hanoi" },
    ]);
    expect(out[0].type).toBe("SHORT_ANSWER");
    expect(out[0].options).toEqual([]);
    expect(out[0].correctAnswer).toBe("Hanoi");
  });

  it("flattens part_1/part_2/part_3 exam structure", () => {
    const out = normalizeQuestions([
      {
        part_1: [{ question_text: "MC?", options: { A: "1", B: "2", C: "3", D: "4" }, correct_answer: "B", explanation: "x" }],
        part_2: [{ context: "C", statements: [{ statement: "S1", is_correct: true }, { statement: "S2", is_correct: false }, { statement: "S3", is_correct: true }, { statement: "S4", is_correct: false }] }],
        part_3: [{ question_text: "SA?", answer: "42" }],
      },
    ]);
    expect(out).toHaveLength(3);
    expect(out[0].type).toBe("MULTIPLE_CHOICE");
    expect(out[0].correctAnswer).toBe("1"); // B -> index 1
    expect(out[1].type).toBe("TRUE_FALSE");
    expect(out[1].correctAnswer).toBe("T,F,T,F");
    expect(out[2].type).toBe("SHORT_ANSWER");
    expect(out[2].correctAnswer).toBe("42");
  });

  it("defaults type to MULTIPLE_CHOICE for unknown type", () => {
    const out = normalizeQuestions([
      { questionText: "Q", type: "WEIRD", options: ["a", "b", "c", "d"], correctAnswer: "0" },
    ]);
    expect(out[0].type).toBe("MULTIPLE_CHOICE");
  });

  it("returns [] for non-array input", () => {
    expect(normalizeQuestions(null)).toEqual([]);
    expect(normalizeQuestions({})).toEqual([]);
  });

  it("drops questions with empty text", () => {
    const out = normalizeQuestions([
      { questionText: "", options: ["a"], correctAnswer: "0" },
      { questionText: "Good", options: ["a", "b", "c", "d"], correctAnswer: "0" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].questionText).toBe("Good");
  });
});
