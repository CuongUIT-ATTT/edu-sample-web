import { describe, it, expect } from "vitest";
import { db } from "./helpers";

async function sid(email: string) {
  const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
  return u?.studentProfile?.id;
}

describe("Grade - 3 loại điểm", () => {
  it("hs001 có đủ QUIZ/MIDTERM/FINAL cho Toán", async () => {
    const id = await sid("hs001@email.com");
    const subj = await db.subject.findUnique({ where: { code: "MATH" } });
    const grades = await db.grade.findMany({ where: { studentId: id, subjectId: subj!.id } });
    const types = grades.map((g) => g.type);
    expect(types).toContain("QUIZ");
    expect(types).toContain("MIDTERM");
    expect(types).toContain("FINAL");
  });
});

describe("Homework - Deadline", () => {
  it("hs002 nộp trễ hạn", async () => {
    const id = await sid("hs002@email.com");
    const hw = await db.homeworkSubmission.findFirst({
      where: { studentId: id },
      include: { schedule: true },
    });
    expect(hw).not.toBeNull();
    expect(hw!.submittedAt.getTime()).toBeGreaterThan(hw!.schedule.homeworkDueDate!.getTime());
  });

  it("hs003 nộp nhưng chưa chấm (grade=null)", async () => {
    const id = await sid("hs003@email.com");
    const hw = await db.homeworkSubmission.findFirst({ where: { studentId: id, grade: null } });
    expect(hw).not.toBeNull();
  });

  it("hs004 không nộp bài", async () => {
    const id = await sid("hs004@email.com");
    const c = await db.homeworkSubmission.count({ where: { studentId: id } });
    expect(c).toBe(0);
  });
});
