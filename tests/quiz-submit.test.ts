import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "@/lib/auth";
import { submitQuiz } from "@/actions/quizzes";
import { mockDb } from "./setup";

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: "student-1",
    email: "hs@test.local",
    role: "STUDENT" as const,
    name: "Học sinh test",
  });
  mockDb.studentProfile.findUnique.mockResolvedValue({ id: "sp-1", userId: "student-1" });
  mockDb.quizSubmission.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "sub-1", ...data }));
  mockDb.grade.create.mockResolvedValue({ id: "g-1" });
  mockDb.teacherProfile.findFirst.mockResolvedValue({ id: "t-1" });
});

function makeQuiz(overrides: any = {}) {
  return {
    id: "quiz-1",
    title: "Test Quiz",
    duration: 10,
    passingScore: 5,
    answerVisibility: "IMMEDIATELY",
    classId: null,
    deadline: null,
    isPublic: false,
    questions: [
      { id: "q1", text: "Cau 1", type: "MULTIPLE_CHOICE", options: ["A", "B"], correctAnswer: "0", score: 1, explanation: "Giai thich" },
    ],
    ...overrides,
  };
}

describe("submitQuiz - deadline / isLate", () => {
  it("deadline quá khứ → isLate=true, vẫn success (không chặn)", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ deadline: new Date(Date.now() - 86400000) }));
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.success).toBe(true);
    expect(res.data?.isLate).toBe(true);
    expect(res.data?.score).toBe(1);
  });

  it("deadline null → isLate=false", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ deadline: null }));
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.success).toBe(true);
    expect(res.data?.isLate).toBe(false);
  });
});

describe("submitQuiz - answerVisibility", () => {
  it("IMMEDIATELY → correctAnswers không null", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ answerVisibility: "IMMEDIATELY" }));
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.data?.correctAnswers).not.toBeNull();
  });

  it("NEVER → correctAnswers null kể cả timeExpired=true", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ answerVisibility: "NEVER" }));
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, timeExpired: true });
    expect(res.data?.correctAnswers).toBeNull();
  });

  it("WHEN_ENDED + timeExpired=true → show; timeExpired=false → không show", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ answerVisibility: "WHEN_ENDED" }));
    const expired = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, timeExpired: true });
    expect(expired.data?.correctAnswers).not.toBeNull();

    const notExpired = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, timeExpired: false });
    expect(notExpired.data?.correctAnswers).toBeNull();
  });

  it("AFTER_ALL_SUBMITTED + classId null → show như IMMEDIATELY", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ answerVisibility: "AFTER_ALL_SUBMITTED", classId: null }));
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.data?.correctAnswers).not.toBeNull();
  });

  it("AFTER_ALL_SUBMITTED + chưa đủ người → không show", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ answerVisibility: "AFTER_ALL_SUBMITTED", classId: "c1", deadline: null }));
    mockDb.class.findUnique.mockResolvedValue({ _count: { students: 3 } });
    mockDb.quizSubmission.findMany.mockResolvedValue([{ studentId: "s1" }, { studentId: "s2" }]);
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.data?.correctAnswers).toBeNull();
  });

  it("AFTER_ALL_SUBMITTED + đủ người → show", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ answerVisibility: "AFTER_ALL_SUBMITTED", classId: "c1", deadline: null }));
    mockDb.class.findUnique.mockResolvedValue({ _count: { students: 3 } });
    mockDb.quizSubmission.findMany.mockResolvedValue([{ studentId: "s1" }, { studentId: "s2" }, { studentId: "sp-1" }]);
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.data?.correctAnswers).not.toBeNull();
  });

  it("AFTER_ALL_SUBMITTED + qua deadline (chưa đủ người) → show", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({
      answerVisibility: "AFTER_ALL_SUBMITTED",
      classId: "c1",
      deadline: new Date(Date.now() - 3600000),
    }));
    mockDb.quizSubmission.findMany.mockResolvedValue([{ studentId: "s1" }]);
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.data?.correctAnswers).not.toBeNull();
  });

  it("AFTER_ALL_SUBMITTED + class không tìm thấy → không show", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ answerVisibility: "AFTER_ALL_SUBMITTED", classId: "c1", deadline: null }));
    mockDb.class.findUnique.mockResolvedValue(null);
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });
    expect(res.data?.correctAnswers).toBeNull();
  });
});
