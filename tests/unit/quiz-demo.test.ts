import { describe, it, expect } from "vitest";

// Score calculation logic identical to the component client-side code
function calculateDemoScore(selectedAnswers: Record<number, number>, correctAnswers: number[]) {
  let score = 0;
  correctAnswers.forEach((correctIndex, qIdx) => {
    if (selectedAnswers[qIdx] === correctIndex) {
      score += 1;
    }
  });
  return {
    score,
    passed: score >= 2
  };
}

describe("Demo Quiz Scoring Logic", () => {
  const correctAnswers = [0, 2, 1]; // Correct answers mapping to Math questions

  it("should calculate correct score of 3/3 and pass when all answers are correct", () => {
    const selected = { 0: 0, 1: 2, 2: 1 };
    const res = calculateDemoScore(selected, correctAnswers);
    expect(res.score).toBe(3);
    expect(res.passed).toBe(true);
  });

  it("should calculate correct score of 1/3 and fail when only one is correct", () => {
    const selected = { 0: 0, 1: 0, 2: 0 };
    const res = calculateDemoScore(selected, correctAnswers);
    expect(res.score).toBe(1);
    expect(res.passed).toBe(false);
  });
});
