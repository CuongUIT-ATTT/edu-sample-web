import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Quiz - Public & Guest", () => {
  it("quiz 'Trắc nghiệm thử sức - Tiếng Anh cơ bản' là public, có question", async () => {
    const q = await db.quiz.findFirst({
      where: { isPublic: true },
      include: { questions: true },
    });
    expect(q).not.toBeNull();
    expect(q!.questions.length).toBeGreaterThanOrEqual(1);
  });

  it("có submission từ guest (studentId=null, guestName có giá trị)", async () => {
    const sub = await db.quizSubmission.findFirst({ where: { studentId: null } });
    expect(sub).not.toBeNull();
    expect(sub!.guestName).toContain("Khách");
  });
});

describe("Quiz - Deadline & isLate", () => {
  it("quiz 'Kiểm tra 15 phút - Chương 1 Vật Lý' có deadline ở quá khứ", async () => {
    const q = await db.quiz.findFirst({ where: { title: { contains: "Kiểm tra 15 phút" } } });
    expect(q).not.toBeNull();
    expect(q!.deadline).not.toBeNull();
    expect(q!.deadline!.getTime()).toBeLessThan(Date.now());
  });

  it("QuizSubmission có field isLate", async () => {
    const sub = await db.quizSubmission.findFirst();
    expect(sub).toHaveProperty("isLate");
  });

  it("tạo submission mới với isLate=true — điểm vẫn tính bình thường", async () => {
    const q = await db.quiz.findFirstOrThrow();
    const sub = await db.quizSubmission.create({
      data: {
        quizId: q.id,
        score: 6.0,
        answers: JSON.stringify({}),
        guestName: "Test isLate",
        isLate: true,
      },
    });
    expect(sub.isLate).toBe(true);
    expect(sub.score).toBe(6.0); // không bị trừ điểm
  });

  it("tạo submission isLate=false (đúng giờ)", async () => {
    const q = await db.quiz.findFirstOrThrow();
    const sub = await db.quizSubmission.create({
      data: {
        quizId: q.id,
        score: 9.0,
        answers: JSON.stringify({}),
        guestName: "Test on-time",
        isLate: false,
      },
    });
    expect(sub.isLate).toBe(false);
    expect(sub.score).toBe(9.0);
  });
});
