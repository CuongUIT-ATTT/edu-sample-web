import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { db } from "./helpers";

const testKey = `quiz-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

let subjectId = "";
let publicQuizId = "";
let deadlineQuizId = "";

beforeAll(async () => {
  const subject = await db.subject.create({
    data: {
      name: `Môn test ${testKey}`,
      code: `QT-${Math.floor(Math.random() * 1000000)}`,
    },
  });
  subjectId = subject.id;

  const publicQuiz = await db.quiz.create({
    data: {
      title: `Trắc nghiệm thử sức - Tiếng Anh cơ bản - ${testKey}`,
      description: "Quiz public cho test",
      duration: 15,
      passingScore: 5,
      isPublic: true,
      subjectId,
      questions: {
        create: {
          text: "2 + 2 = ?",
          type: "MULTIPLE_CHOICE",
          options: ["3", "4", "5", "6"],
          correctAnswer: "1",
        },
      },
    },
    include: { questions: true },
  });
  publicQuizId = publicQuiz.id;

  await db.quizSubmission.create({
    data: {
      quizId: publicQuizId,
      score: 7,
      answers: {},
      guestName: `Guest ${testKey}`,
      isLate: false,
    },
  });

  const deadlineQuiz = await db.quiz.create({
    data: {
      title: `Kiểm tra 15 phút - Chương 1 Vật Lý - ${testKey}`,
      description: "Quiz deadline quá khứ cho test",
      duration: 15,
      passingScore: 5,
      deadline: new Date("2026-01-01T00:00:00.000Z"),
      isPublic: false,
      subjectId,
      questions: {
        create: {
          text: "Vật lý cơ bản",
          type: "MULTIPLE_CHOICE",
          options: ["A", "B", "C", "D"],
          correctAnswer: "0",
        },
      },
    },
  });
  deadlineQuizId = deadlineQuiz.id;
});

afterAll(async () => {
  if (subjectId) {
    await db.subject.delete({ where: { id: subjectId } }).catch(() => {});
  }
});

describe("Quiz - Public & Guest", () => {
  it("quiz public của test có question", async () => {
    const q = await db.quiz.findUnique({
      where: { id: publicQuizId },
      include: { questions: true },
    });
    expect(q).not.toBeNull();
    expect(q!.isPublic).toBe(true);
    expect(q!.questions.length).toBeGreaterThanOrEqual(1);
  });

  it("có submission từ guest (studentId=null, guestName có giá trị)", async () => {
    const sub = await db.quizSubmission.findFirst({
      where: {
        quizId: publicQuizId,
        studentId: null,
      },
    });
    expect(sub).not.toBeNull();
    expect(sub!.guestName).toBeTruthy();
  });
});

describe("Quiz - Deadline & isLate", () => {
  it("quiz deadline của test có deadline ở quá khứ", async () => {
    const q = await db.quiz.findUnique({ where: { id: deadlineQuizId } });
    expect(q).not.toBeNull();
    expect(q!.deadline).not.toBeNull();
    expect(q!.deadline!.getTime()).toBeLessThan(Date.now());
  });

  it("QuizSubmission có field isLate", async () => {
    const sub = await db.quizSubmission.findFirst({ where: { quizId: publicQuizId } });
    expect(sub).toHaveProperty("isLate");
  });

  it("tạo submission mới với isLate=true — điểm vẫn tính bình thường", async () => {
    const sub = await db.quizSubmission.create({
      data: {
        quizId: publicQuizId,
        score: 6.0,
        answers: {},
        guestName: `Test isLate ${testKey}`,
        isLate: true,
      },
    });
    expect(sub.isLate).toBe(true);
    expect(sub.score).toBe(6.0);
  });

  it("tạo submission isLate=false (đúng giờ)", async () => {
    const sub = await db.quizSubmission.create({
      data: {
        quizId: publicQuizId,
        score: 9.0,
        answers: {},
        guestName: `Test on-time ${testKey}`,
        isLate: false,
      },
    });
    expect(sub.isLate).toBe(false);
    expect(sub.score).toBe(9.0);
  });
});
