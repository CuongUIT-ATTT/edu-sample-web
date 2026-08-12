import { describe, it, expect } from "vitest";
import { db } from "./helpers";

async function sid(email: string) {
  const u = await db.user.findUnique({ where: { email }, include: { studentProfile: true } });
  return u?.studentProfile?.id;
}

describe("Grade - các loại điểm", () => {
  it("student2 có QUIZ và HOMEWORK cho Toán (MATH101)", async () => {
    const id = await sid("student2@eduweb.vn");
    const subj = await db.subject.findUnique({ where: { code: "MATH101" } });
    const grades = await db.grade.findMany({ where: { studentId: id, subjectId: subj!.id } });
    const types = grades.map((g) => g.type);
    expect(types).toContain("QUIZ");
    expect(types).toContain("HOMEWORK");
  });
});

describe("Homework - Deadline", () => {
  it("student3 nộp trễ hạn", async () => {
    const id = await sid("student3@eduweb.vn");
    const hw = await db.homeworkSubmission.findFirst({
      where: { studentId: id },
      include: { series: true },
    });
    expect(hw).not.toBeNull();
    expect(hw!.submittedAt.getTime()).toBeGreaterThan(hw!.series.homeworkDueDate!.getTime());
  });

  it("student4 nộp nhưng chưa chấm (grade=null)", async () => {
    const id = await sid("student4@eduweb.vn");
    const hw = await db.homeworkSubmission.findFirst({ where: { studentId: id, grade: null } });
    expect(hw).not.toBeNull();
  });

  it("student5 không nộp bài", async () => {
    const id = await sid("student5@eduweb.vn");
    const c = await db.homeworkSubmission.count({ where: { studentId: id } });
    expect(c).toBe(0);
  });
});
