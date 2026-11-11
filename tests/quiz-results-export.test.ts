import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockDb } from "./setup";
import { loadQuizResultsExport } from "@/lib/quiz-results-export";

const adminSession = { userId: "admin", email: "admin@example.test", role: "ADMIN" as const, name: "Admin", isRoot: false };
const ownerTeacherSession = { userId: "teacher-user", email: "teacher@example.test", role: "TEACHER" as const, name: "Teacher", isRoot: false };

const quiz = {
  id: "quiz-1",
  title: "Kiểm tra chương 1",
  passingScore: 5,
  teacherId: "teacher-1",
  classId: "class-1",
  class: { id: "class-1", name: "10A1" },
  assignments: [{ classId: "class-1", class: { id: "class-1", name: "10A1" } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.quiz.findUnique.mockResolvedValue(quiz);
  mockDb.teacherProfile.findUnique.mockResolvedValue({ id: "teacher-1" });
  mockDb.quizSubmission.findMany.mockResolvedValue([{
    id: "submission-1",
    score: 7.5,
    isLate: true,
    submittedAt: new Date("2026-01-15T02:30:00.000Z"),
    candidate: null,
    student: { user: { name: "Nguyễn Văn A" } },
    guestName: null,
    attempt: { examCode: "AB12" },
  }]);
});

describe("quiz results export data loading", () => {
  it("allows an admin and returns every submission row for the selected class", async () => {
    const result = await loadQuizResultsExport(adminSession, "quiz-1", "class-1");

    expect(result).toMatchObject({ success: true, data: { quizTitle: "Kiểm tra chương 1", className: "10A1" } });
    if (result.success) {
      expect(result.data.rows).toEqual([expect.objectContaining({ candidateName: "Nguyễn Văn A", examCode: "AB12", passed: true, isLate: true })]);
    }
    expect(mockDb.quizSubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        quizId: "quiz-1",
        OR: [
          { classId: "class-1" },
          { classId: null, student: { classes: { some: { id: "class-1" } } } },
        ],
      },
    }));
  });

  it("allows only the teacher who owns the quiz", async () => {
    const result = await loadQuizResultsExport(ownerTeacherSession, "quiz-1", "class-1");

    expect(result.success).toBe(true);
    expect(mockDb.quizSubmission.findMany).toHaveBeenCalledOnce();
  });

  it("rejects a teacher who does not own the quiz before reading submissions", async () => {
    mockDb.teacherProfile.findUnique.mockResolvedValue({ id: "other-teacher" });

    const result = await loadQuizResultsExport(ownerTeacherSession, "quiz-1", "class-1");

    expect(result).toEqual(expect.objectContaining({ success: false, status: 403 }));
    expect(mockDb.quizSubmission.findMany).not.toHaveBeenCalled();
  });

  it("rejects a class outside the quiz assignment", async () => {
    const result = await loadQuizResultsExport(adminSession, "quiz-1", "class-2");

    expect(result).toEqual(expect.objectContaining({ success: false, status: 404 }));
    expect(mockDb.quizSubmission.findMany).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers", async () => {
    const result = await loadQuizResultsExport(null, "quiz-1", "class-1");

    expect(result).toEqual(expect.objectContaining({ success: false, status: 401 }));
    expect(mockDb.quiz.findUnique).not.toHaveBeenCalled();
  });
});
