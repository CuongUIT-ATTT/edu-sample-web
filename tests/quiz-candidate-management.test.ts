import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  resetQuizCandidateSubmissions,
  setQuizCandidateMaxSubmissions,
} from "@/actions/quizzes";
import { mockDb } from "./setup";

const adminSession = {
  userId: "admin-user",
  email: "admin@example.test",
  role: "ADMIN" as const,
  name: "Admin",
  isRoot: false,
};

const ownerTeacherSession = {
  userId: "teacher-user",
  email: "teacher@example.test",
  role: "TEACHER" as const,
  name: "Teacher",
  isRoot: false,
};

const managedQuiz = { id: "quiz-1", teacherId: "teacher-1" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue(adminSession);
  mockDb.quiz.findUnique.mockResolvedValue(managedQuiz);
  mockDb.quizCandidate.updateMany.mockResolvedValue({ count: 1 });
  mockDb.quizCandidate.findFirst.mockResolvedValue({
    submittedCount: 2,
    maxSubmissionsOverride: 5,
  });
});

describe("quiz candidate submission management", () => {
  it("allows an admin to reset only a candidate's consumed submissions", async () => {
    const result = await resetQuizCandidateSubmissions("quiz-1", "candidate-1");

    expect(result).toEqual({ success: true, data: { submittedCount: 0 } });
    expect(mockDb.quizCandidate.updateMany).toHaveBeenCalledWith({
      where: { id: "candidate-1", quizId: "quiz-1" },
      data: { submittedCount: 0 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/teacher/quizzes");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/quizzes");
  });

  it("does not mutate a candidate outside the selected quiz", async () => {
    mockDb.quizCandidate.updateMany.mockResolvedValue({ count: 0 });

    const result = await resetQuizCandidateSubmissions("quiz-1", "candidate-from-another-quiz");

    expect(result).toEqual({ success: false, error: "Không tìm thấy thí sinh." });
    expect(mockDb.quizCandidate.updateMany).toHaveBeenCalledWith({
      where: { id: "candidate-from-another-quiz", quizId: "quiz-1" },
      data: { submittedCount: 0 },
    });
  });

  it("allows the quiz owner teacher to reset consumed submissions", async () => {
    vi.mocked(getSession).mockResolvedValue(ownerTeacherSession);
    mockDb.teacherProfile.findUnique.mockResolvedValue({ id: "teacher-1" });

    const result = await resetQuizCandidateSubmissions("quiz-1", "candidate-1");

    expect(result.success).toBe(true);
    expect(mockDb.quizCandidate.updateMany).toHaveBeenCalledTimes(1);
  });

  it("rejects a teacher who does not own the quiz", async () => {
    vi.mocked(getSession).mockResolvedValue(ownerTeacherSession);
    mockDb.teacherProfile.findUnique.mockResolvedValue({ id: "other-teacher" });

    const result = await resetQuizCandidateSubmissions("quiz-1", "candidate-1");

    expect(result.success).toBe(false);
    expect(mockDb.quizCandidate.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated reset request", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await resetQuizCandidateSubmissions("quiz-1", "candidate-1");

    expect(result.success).toBe(false);
    expect(mockDb.quizCandidate.updateMany).not.toHaveBeenCalled();
  });

  it("sets a per-candidate limit of zero and returns the effective limit", async () => {
    mockDb.quiz.findUnique
      .mockResolvedValueOnce(managedQuiz)
      .mockResolvedValueOnce({ candidateMaxSubmissions: 3 });
    mockDb.quizCandidate.findFirst.mockResolvedValue({
      submittedCount: 2,
      maxSubmissionsOverride: 0,
    });

    const result = await setQuizCandidateMaxSubmissions("quiz-1", "candidate-1", 0);

    expect(result).toEqual({
      success: true,
      data: {
        submittedCount: 2,
        maxSubmissionsOverride: 0,
        effectiveMaxSubmissions: 0,
      },
    });
    expect(mockDb.quizCandidate.updateMany).toHaveBeenCalledWith({
      where: { id: "candidate-1", quizId: "quiz-1" },
      data: { maxSubmissionsOverride: 0 },
    });
  });

  it("clears an override to inherit the quiz-wide limit", async () => {
    mockDb.quiz.findUnique
      .mockResolvedValueOnce(managedQuiz)
      .mockResolvedValueOnce({ candidateMaxSubmissions: 3 });
    mockDb.quizCandidate.findFirst.mockResolvedValue({
      submittedCount: 1,
      maxSubmissionsOverride: null,
    });

    const result = await setQuizCandidateMaxSubmissions("quiz-1", "candidate-1", null);

    expect(result).toEqual({
      success: true,
      data: {
        submittedCount: 1,
        maxSubmissionsOverride: null,
        effectiveMaxSubmissions: 3,
      },
    });
    expect(mockDb.quizCandidate.updateMany).toHaveBeenCalledWith({
      where: { id: "candidate-1", quizId: "quiz-1" },
      data: { maxSubmissionsOverride: null },
    });
  });

  it.each([-1, 101, 1.5, Number.NaN, "1"])("rejects an invalid individual limit: %s", async (limit) => {
    const result = await setQuizCandidateMaxSubmissions("quiz-1", "candidate-1", limit as never);

    expect(result.success).toBe(false);
    expect(mockDb.quizCandidate.updateMany).not.toHaveBeenCalled();
  });
});
