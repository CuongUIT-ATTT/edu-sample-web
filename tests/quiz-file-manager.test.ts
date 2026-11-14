import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSession } from "@/lib/auth";
import { createQuiz, updateQuiz, getQuizFileManagerList } from "@/actions/quizzes";
import { mockDb } from "./setup";

const admin = { userId: "admin-1", role: "ADMIN" as const, email: "admin@example.test", name: "Admin", isRoot: false };
const input = {
  title: "Quiz", duration: 15, passingScore: 5, subjectId: "subject-1", isPublic: true,
  questions: [{ questionText: "Question", options: ["A", "B"], correctAnswer: "0" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue(admin);
  mockDb.quiz.create.mockResolvedValue({ id: "quiz-1" });
  mockDb.quiz.findUnique.mockResolvedValue({ teacherId: "teacher-1", candidateAccessRequired: false });
  mockDb.quiz.findMany.mockResolvedValue([]);
});

describe("quiz creator identity", () => {
  it.each(["ADMIN", "TEACHER"] as const)("records the authenticated %s despite forged metadata", async (role) => {
    vi.mocked(getSession).mockResolvedValue({ ...admin, role });
    mockDb.teacherProfile.findUnique.mockResolvedValue({ id: "teacher-1" });
    expect((await createQuiz({ ...input, createdById: "forged", userId: "forged", role: "ADMIN" } as typeof input)).success).toBe(true);
    expect(mockDb.quiz.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      createdById: admin.userId, teacherId: role === "TEACHER" ? "teacher-1" : null,
    }) });
  });

  it("never takes over creator or historical timestamps on edit", async () => {
    expect((await updateQuiz({ ...input, id: "quiz-1", createdById: "forged" } as typeof input & { id: string })).success).toBe(true);
    const data = mockDb.quiz.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("createdById");
    expect(data).not.toHaveProperty("createdAt");
    expect(data).not.toHaveProperty("updatedAt");
  });

  it("rejects creation without a session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await createQuiz(input)).success).toBe(false);
    expect(mockDb.quiz.create).not.toHaveBeenCalled();
  });
});

describe("quiz file manager metadata", () => {
  it.each([null, { ...admin, role: "STUDENT" as const }, { ...admin, role: "PARENT" as const }])("rejects unauthorized readers", async (session) => {
    vi.mocked(getSession).mockResolvedValue(session);
    expect((await getQuizFileManagerList()).success).toBe(false);
    expect(mockDb.quiz.findMany).not.toHaveBeenCalled();
  });

  it("preserves unknown legacy metadata and does not select answers or secrets", async () => {
    mockDb.quiz.findMany.mockResolvedValue([{ id: "old", createdAt: null, updatedAt: null, deadline: null, createdBy: null, createdById: null }]);
    const result = await getQuizFileManagerList();
    expect(result.data?.[0]).toMatchObject({ createdAt: null, updatedAt: null, creatorName: null, createdById: null });
    const query = mockDb.quiz.findMany.mock.calls[0][0];
    expect(query.orderBy).toEqual([{ createdAt: { sort: "desc", nulls: "last" } }, { id: "asc" }]);
    expect(query.select).not.toHaveProperty("questions");
    expect(query.select).not.toHaveProperty("candidates");
    expect(query.select.createdBy).toEqual({ select: { id: true, name: true } });
  });

  it("combines teacher ownership with creator and inclusive date filters", async () => {
    vi.mocked(getSession).mockResolvedValue({ ...admin, role: "TEACHER" });
    mockDb.teacherProfile.findUnique.mockResolvedValue({ id: "teacher-1" });
    await getQuizFileManagerList({ createdById: "other-user", dateField: "updatedAt", dateFrom: "2026-11-01T00:00:00Z", dateTo: "2026-11-13T00:00:00Z", sortBy: "updatedAt", sortDirection: "asc" });
    expect(mockDb.quiz.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { teacherId: "teacher-1", createdById: "other-user", updatedAt: { gte: new Date("2026-11-01T00:00:00Z"), lte: new Date("2026-11-13T00:00:00Z") } },
      orderBy: [{ updatedAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    }));
  });

  it("selects unknown creators explicitly and serializes known dates", async () => {
    const date = new Date("2026-11-13T00:00:00Z");
    mockDb.quiz.findMany.mockResolvedValue([{ createdAt: date, updatedAt: date, createdBy: { name: "Admin" } }]);
    expect((await getQuizFileManagerList({ createdById: null })).data?.[0]).toMatchObject({ createdAt: date.toISOString(), creatorName: "Admin" });
    expect(mockDb.quiz.findMany.mock.calls[0][0].where).toEqual({ createdById: null });
  });

  it.each([
    { dateFrom: "invalid" }, { dateFrom: "2026-12-01", dateTo: "2026-11-01" },
    { sortBy: "password" }, { sortDirection: "DROP" }, { dateField: "deadline" }, { createdById: " " },
  ])("rejects invalid filters %j", async (filters) => {
    expect((await getQuizFileManagerList(filters as Parameters<typeof getQuizFileManagerList>[0])).success).toBe(false);
    expect(mockDb.quiz.findMany).not.toHaveBeenCalled();
  });

  it("fails closed when teacher profile is missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ ...admin, role: "TEACHER" });
    mockDb.teacherProfile.findUnique.mockResolvedValue(null);
    expect((await getQuizFileManagerList()).success).toBe(false);
    expect(mockDb.quiz.findMany).not.toHaveBeenCalled();
  });
  it("supports sorting by title", async () => {
    await getQuizFileManagerList({ sortBy: "title", sortDirection: "asc" });
    expect(mockDb.quiz.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ title: "asc" }, { id: "asc" }],
    }));
  });

  it("supports single-ended date filter (dateFrom only)", async () => {
    await getQuizFileManagerList({ dateFrom: "2026-11-01T00:00:00Z" });
    expect(mockDb.quiz.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { createdAt: { gte: new Date("2026-11-01T00:00:00Z") } },
    }));
  });

  it("supports single-ended date filter (dateTo only)", async () => {
    await getQuizFileManagerList({ dateTo: "2026-11-13T00:00:00Z" });
    expect(mockDb.quiz.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { createdAt: { lte: new Date("2026-11-13T00:00:00Z") } },
    }));
  });

  it("catches and handles database errors gracefully", async () => {
    mockDb.quiz.findMany.mockRejectedValue(new Error("DB connection error"));
    const result = await getQuizFileManagerList();
    expect(result).toEqual({ success: false, error: "Lỗi tải danh sách đề thi." });
  });
});
