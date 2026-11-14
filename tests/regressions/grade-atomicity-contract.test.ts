import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "@/lib/auth";
import { mockDb } from "../setup";
import { submitQuiz } from "@/actions/quizzes";

describe("P1 - Grade & QuizSubmission Atomicity and Relation Contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: "student-user-1",
      email: "hs@test.local",
      role: "STUDENT",
    } as any);
  });

  const mockQuiz = {
    id: "quiz-1",
    title: "Quiz Test Atomicity",
    duration: 15,
    passingScore: 5,
    answerVisibility: "IMMEDIATELY",
    classId: null,
    deadline: null,
    isPublic: false,
    shuffleQuestions: false,
    teacherId: "teacher-1",
    subjectId: "subject-1",
    assignments: [],
    questions: [
      { id: "q1", text: "Câu 1", type: "MULTIPLE_CHOICE", options: ["A", "B"], correctAnswer: "0", score: 10, explanation: null },
    ],
  };

  const mockAttempt = {
    id: "attempt-1",
    quizId: "quiz-1",
    studentId: "sp-1",
    guestName: null,
    examCode: "code123",
    quiz: mockQuiz,
    layout: { questionOrder: { MULTIPLE_CHOICE: ["q1"] }, optionOrder: { q1: [0, 1] } },
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 3600000),
    submittedAt: null,
    status: "ACTIVE",
  };

  it("giao dịch nguyên tử: QuizSubmission và Grade được tạo cùng trong tx", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockDb.quizAttempt.findUnique.mockResolvedValue(mockAttempt);
    mockDb.studentProfile.findUnique.mockResolvedValue({ id: "sp-1", userId: "student-user-1" });
    mockDb.quizSubmission.findUnique.mockResolvedValue(null);
    mockDb.quizSubmission.create.mockResolvedValue({
      id: "sub-100",
      quizId: "quiz-1",
      studentId: "sp-1",
      score: 10,
      passed: true,
      answers: { q1: "0" },
    });
    mockDb.grade.create.mockResolvedValue({ id: "grade-100", quizSubmissionId: "sub-100" });

    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, attemptId: "attempt-1" });

    expect(res.success).toBe(true);
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
    expect(mockDb.quizSubmission.create).toHaveBeenCalled();
    expect(mockDb.grade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "sp-1",
          subjectId: "subject-1",
          score: 10,
          type: "QUIZ",
        }),
      })
    );
  });

  it("rollback an toàn: nếu tx.grade.create ném lỗi, toàn bộ giao dịch hủy bỏ", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockDb.quizAttempt.findUnique.mockResolvedValue(mockAttempt);
    mockDb.studentProfile.findUnique.mockResolvedValue({ id: "sp-1", userId: "student-user-1" });
    mockDb.quizSubmission.findUnique.mockResolvedValue(null);
    mockDb.quizSubmission.create.mockResolvedValue({ id: "sub-100" });
    mockDb.grade.create.mockRejectedValue(new Error("FOREIGN KEY CONSTRAINT FAILED"));

    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, attemptId: "attempt-1" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Đã xảy ra lỗi hệ thống khi chấm bài thi trắc nghiệm.");
  });

  it("idempotency contract: khi retry với attemptId đã nộp, không ghi đè hoặc nhân bản Grade", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(mockQuiz);
    mockDb.quizAttempt.findUnique.mockResolvedValue({ ...mockAttempt, status: "SUBMITTED" });
    mockDb.quizSubmission.findUnique.mockResolvedValue({
      id: "sub-100",
      quizId: "quiz-1",
      score: 10,
      maxScore: 10,
      passed: true,
      answers: { q1: "0" },
    });

    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, attemptId: "attempt-1" });

    expect(res.success).toBe(true);
    expect(res.data?.submissionId).toBe("sub-100");
    expect(mockDb.grade.create).not.toHaveBeenCalled();
  });
});
