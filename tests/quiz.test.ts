import { describe, it, expect } from "vitest";
import { db } from "./helpers";

describe("Quiz - Types & Images", () => {
  it("qz-001 (public) có 3 loại question", async () => {
    const q = await db.quiz.findUnique({ where: { id: "qz-001" }, include: { questions: true } });
    expect(q).not.toBeNull();
    expect(q!.isPublic).toBe(true);
    const types = q!.questions.map((x) => x.type);
    expect(types).toContain("MULTIPLE_CHOICE");
    expect(types).toContain("TRUE_FALSE");
    expect(types).toContain("SHORT_ANSWER");
  });

  it("qz-002 là private (isPublic=false)", async () => {
    const q = await db.quiz.findUnique({ where: { id: "qz-002" } });
    expect(q!.isPublic).toBe(false);
  });

  it("qs-003 có ảnh, qs-001 không", async () => {
    const q3 = await db.question.findUnique({ where: { id: "qs-003" } });
    const q1 = await db.question.findUnique({ where: { id: "qs-001" } });
    expect(q3!.imageUrl).not.toBeNull();
    expect(q1!.imageUrl).toBeNull();
  });

  it("có submission từ guest (Nguyễn Văn Khách)", async () => {
    const sub = await db.quizSubmission.findFirst({ where: { studentId: null } });
    expect(sub).not.toBeNull();
    expect(sub!.guestName).toContain("Nguyễn");
  });
});
