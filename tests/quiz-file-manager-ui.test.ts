import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(), list: vi.fn(), quizzes: vi.fn(), subjects: vi.fn(), classes: vi.fn(), teacher: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/actions/quizzes", () => ({ getQuizFileManagerList: mocks.list }));
vi.mock("@/lib/db", () => ({ db: {
  quiz: { findMany: mocks.quizzes }, subject: { findMany: mocks.subjects },
  class: { findMany: mocks.classes }, teacherProfile: { findUnique: mocks.teacher },
} }));
vi.mock("@/lib/teacher-classes", () => ({ teacherClassIds: vi.fn().mockResolvedValue([]) }));
vi.mock("@/components/TeacherQuizManager", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("redirect"); }) }));
import AdminPage from "@/app/admin/quizzes/page";
import TeacherPage from "@/app/teacher/quizzes/page";

const metadata = { id: "quiz-1", title: "Đề thi", creatorName: null, createdAt: null, updatedAt: null };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ userId: "user-1", role: "ADMIN" });
  mocks.list.mockResolvedValue({ success: true, data: [metadata] });
  mocks.quizzes.mockResolvedValue([]);
  mocks.subjects.mockResolvedValue([]); mocks.classes.mockResolvedValue([]);
  mocks.teacher.mockResolvedValue({ id: "teacher-1" });
});
const managerProps = (page: Awaited<ReturnType<typeof AdminPage>>) => page.props.children[1].props;

describe("Quiz manager server UI", () => {
  it("uses metadata action and never queries question content for an admin list", async () => {
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    expect(mocks.list).toHaveBeenCalledOnce();
    expect(managerProps(page).quizzes).toEqual([metadata]);
    expect(managerProps(page).editQuiz).toBeUndefined();
    expect(mocks.quizzes).toHaveBeenCalledTimes(1);
    expect(mocks.quizzes.mock.calls[0][0]).toEqual({
      where: { id: { in: ["quiz-1"] }, candidateAccessRequired: true }, select: { id: true },
    });
  });
  it("restricts teacher editor details to session teacher ownership", async () => {
    mocks.session.mockResolvedValue({ userId: "user-1", role: "TEACHER" });
    const page = await TeacherPage({ searchParams: Promise.resolve({ edit: "other-quiz" }) });
    expect(mocks.quizzes.mock.calls[1][0].where).toEqual({ teacherId: "teacher-1", id: "other-quiz" });
    expect(managerProps(page).editQuiz).toBeUndefined();
    expect(managerProps(page).listLoadError).toBe(true);
  });
  it("exposes a load error rather than a misleading empty list", async () => {
    mocks.list.mockResolvedValue({ success: false, error: "Unavailable" });
    const page = await AdminPage({ searchParams: Promise.resolve({}) });
    expect(managerProps(page).listLoadError).toBe(true);
    expect(managerProps(page).quizzes).toEqual([]);
  });
  it("redirects an unauthorized visitor before loading metadata", async () => {
    mocks.session.mockResolvedValue({ userId: "student-1", role: "STUDENT" });
    await expect(AdminPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect");
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it("allows teacher to load editor details for own quiz", async () => {
    mocks.session.mockResolvedValue({ userId: "user-1", role: "TEACHER" });
    const ownQuiz = { id: "my-quiz", title: "My Quiz", teacherId: "teacher-1", questions: [] };
    mocks.quizzes.mockResolvedValueOnce([]).mockResolvedValueOnce([ownQuiz]);
    const page = await TeacherPage({ searchParams: Promise.resolve({ edit: "my-quiz" }) });
    expect(managerProps(page).editQuiz).toEqual(ownQuiz);
    expect(managerProps(page).listLoadError).toBe(false);
  });
});
