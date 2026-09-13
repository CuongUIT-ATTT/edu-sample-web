import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "@/lib/auth";
import { startQuizAttempt, submitQuiz } from "@/actions/quizzes";
import { mockDb } from "./setup";

interface MockQuestion {
  id: string;
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
  score: number;
  explanation: string | null;
  imageUrl?: string | null;
}

interface MockAssignment {
  classId: string;
  deadlineOverride: Date | null;
  startsAtOverride: Date | null;
  class?: { id: string; name: string } | null;
}

interface MockQuiz {
  id: string;
  title: string;
  duration: number;
  passingScore: number;
  answerVisibility: string;
  classId: string | null;
  deadline: Date | null;
  isPublic: boolean;
  shuffleQuestions: boolean;
  teacherId: string | null;
  subjectId: string;
  assignments: MockAssignment[];
  questions: MockQuestion[];
}

interface MockAttempt {
  id: string;
  quizId: string;
  studentId: string | null;
  guestName: string | null;
  examCode: string;
  layout: {
    questionOrder: Record<string, string[]>;
    optionOrder: Record<string, number[]>;
  };
  startsAt: Date;
  endsAt: Date;
  submittedAt: Date | null;
  status: string;
  quiz: MockQuiz;
}

const assignedStudentProfile = {
  id: "sp-1",
  userId: "student-1",
  classes: [{ id: "c1", name: "10A1" }],
};

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({
    userId: "student-1",
    email: "hs@test.local",
    role: "STUDENT" as const,
    name: "Học sinh test",
    isRoot: false,
  });
  mockDb.studentProfile.findUnique.mockResolvedValue(assignedStudentProfile);
  mockDb.quizSubmission.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: "sub-1", ...data }));
  mockDb.grade.create.mockResolvedValue({ id: "g-1" });
  mockDb.teacherProfile.findFirst.mockResolvedValue({ id: "t-1" });
  mockDb.quizAttempt.create.mockImplementation(({ data }: { data: { endsAt: Date; examCode: string } }) =>
    Promise.resolve({ id: "attempt-1", examCode: data.examCode, endsAt: data.endsAt }),
  );
  mockDb.quizAttempt.findFirst.mockResolvedValue(null);
});

function makeQuiz(overrides: Partial<MockQuiz> = {}): MockQuiz {
  return {
    id: "quiz-1",
    title: "Test Quiz",
    duration: 10,
    passingScore: 5,
    answerVisibility: "IMMEDIATELY",
    classId: null,
    deadline: null,
    isPublic: false,
    shuffleQuestions: true,
    teacherId: "teacher-1",
    subjectId: "subject-1",
    assignments: [],
    questions: [
      {
        id: "q1",
        text: "Cau 1",
        type: "MULTIPLE_CHOICE",
        options: ["A", "B"],
        correctAnswer: "0",
        score: 1,
        explanation: "Giai thich",
        imageUrl: null,
      },
    ],
    ...overrides,
  };
}

function makeAssignment(overrides: Partial<MockAssignment> = {}): MockAssignment {
  return {
    classId: "c1",
    deadlineOverride: null,
    startsAtOverride: null,
    class: { id: "c1", name: "10A1" },
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

  it("deadlineOverride quá khứ → isLate=true dù deadline mặc định còn hạn", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({
      deadline: new Date(Date.now() + 86400000),
      assignments: [makeAssignment({ deadlineOverride: new Date(Date.now() - 3600000) })],
    }));

    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });

    expect(res.success).toBe(true);
    expect(res.data?.isLate).toBe(true);
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

  it("AFTER_ALL_SUBMITTED + assignment lớp hiệu lực chưa đủ người → không show", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({
      answerVisibility: "AFTER_ALL_SUBMITTED",
      assignments: [makeAssignment({ classId: "c1" }), makeAssignment({ classId: "c2" })],
    }));
    mockDb.class.findUnique.mockResolvedValue({ _count: { students: 2 } });
    mockDb.quizSubmission.findMany.mockResolvedValue([{ studentId: "s1" }]);

    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" } });

    expect(mockDb.class.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "c1" } }));
    expect(res.data?.correctAnswers).toBeNull();
  });

  it("AFTER_ALL_SUBMITTED + qua deadline override của lớp → show", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({
      answerVisibility: "AFTER_ALL_SUBMITTED",
      deadline: new Date(Date.now() + 3600000),
      assignments: [makeAssignment({ deadlineOverride: new Date(Date.now() - 3600000) })],
    }));
    mockDb.quizSubmission.findMany.mockResolvedValue([{ studentId: "s1" }]);
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

describe("startQuizAttempt - class assignments", () => {
  it("học sinh trong lớp được gán có thể bắt đầu làm bài", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ assignments: [makeAssignment()] }));

    const res = await startQuizAttempt({ quizId: "quiz-1" });

    expect(res.success).toBe(true);
    expect(res.data?.attemptId).toBe("attempt-1");
    expect(mockDb.quizAttempt.create).toHaveBeenCalled();
  });

  it("học sinh ngoài các lớp được gán không thể bắt đầu quiz private", async () => {
    mockDb.studentProfile.findUnique.mockResolvedValue({
      id: "sp-1",
      userId: "student-1",
      classes: [{ id: "other-class", name: "10A2" }],
    });
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ assignments: [makeAssignment()] }));

    const res = await startQuizAttempt({ quizId: "quiz-1" });

    expect(res.success).toBe(false);
    expect(res.error).toContain("không tham gia");
    expect(mockDb.quizAttempt.create).not.toHaveBeenCalled();
  });

  it("startsAtOverride trong tương lai chặn bắt đầu làm bài", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({
      assignments: [makeAssignment({ startsAtOverride: new Date(Date.now() + 3600000) })],
    }));

    const res = await startQuizAttempt({ quizId: "quiz-1" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("Đề thi chưa mở cho lớp của bạn.");
    expect(mockDb.quizAttempt.create).not.toHaveBeenCalled();
  });

  it("legacy classId path vẫn cho học sinh đúng lớp bắt đầu", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz({ classId: "c1", assignments: [] }));

    const res = await startQuizAttempt({ quizId: "quiz-1" });

    expect(res.success).toBe(true);
    expect(mockDb.quizAttempt.create).toHaveBeenCalled();
  });
});

describe("submitQuiz - attemptId (mã đề xáo trộn)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      userId: "student-1",
      email: "hs@test.local",
      role: "STUDENT" as const,
      name: "Học sinh test",
      isRoot: false,
    });
    mockDb.studentProfile.findUnique.mockResolvedValue(assignedStudentProfile);
    mockDb.quizSubmission.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: "sub-1", ...data }));
    mockDb.grade.create.mockResolvedValue({ id: "g-1" });
    mockDb.teacherProfile.findFirst.mockResolvedValue({ id: "t-1" });
    mockDb.quizAttempt.update.mockResolvedValue({ id: "attempt-1", status: "SUBMITTED" });
  });

  function makeAttempt(overrides: Partial<MockAttempt> = {}): MockAttempt {
    return {
      id: "attempt-1",
      quizId: "quiz-1",
      studentId: "sp-1",
      guestName: null,
      examCode: "ab12",
      layout: {
        questionOrder: { MULTIPLE_CHOICE: ["q1"] },
        optionOrder: { q1: [0, 1] },
      },
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 3600000),
      submittedAt: null,
      status: "ACTIVE",
      quiz: makeQuiz(),
      ...overrides,
    };
  }

  it("chấm theo attemptId (layout identity) → điểm đúng", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz());
    mockDb.quizAttempt.findUnique.mockResolvedValue(makeAttempt());
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, attemptId: "attempt-1" });
    expect(res.success).toBe(true);
    expect(res.data?.score).toBe(1);
    expect(res.data?.correctAnswers?.[0].correctAnswer).toBe("0");
    expect(mockDb.quizAttempt.update).toHaveBeenCalled();
  });

  it("chấm theo attemptId (layout hoán vị) → map display→original đúng", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz());
    mockDb.quizAttempt.findUnique.mockResolvedValue(makeAttempt({
      layout: { questionOrder: { MULTIPLE_CHOICE: ["q1"] }, optionOrder: { q1: [1, 0] } },
    }));
    // correct = "0" (original). Hoán vị [1,0] → display đúng = 1
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "1" }, attemptId: "attempt-1" });
    expect(res.data?.score).toBe(1);
    expect(res.data?.correctAnswers?.[0].correctAnswer).toBe("1");
  });

  it("quá hạn endsAt → isLate=true + status TIMED_OUT", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz());
    mockDb.quizAttempt.findUnique.mockResolvedValue(makeAttempt({ endsAt: new Date(Date.now() - 1000) }));
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, attemptId: "attempt-1" });
    expect(res.data?.isLate).toBe(true);
    expect(mockDb.quizAttempt.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "TIMED_OUT" }) }));
  });

  it("attemptId không tồn tại → error", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz());
    mockDb.quizAttempt.findUnique.mockResolvedValue(null);
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, attemptId: "attempt-missing" });
    expect(res.success).toBe(false);
  });

  it("attemptId thuộc người khác → error", async () => {
    mockDb.quiz.findUnique.mockResolvedValue(makeQuiz());
    mockDb.quizAttempt.findUnique.mockResolvedValue(makeAttempt({ studentId: "other-student" }));
    const res = await submitQuiz({ quizId: "quiz-1", answers: { q1: "0" }, attemptId: "attempt-1" });
    expect(res.success).toBe(false);
  });
});
