import { describe, it, expect } from "vitest";

describe("P1 - QuizCandidate Uniqueness & Nullable Constraint Logic", () => {
  // Mô phỏng logic PostgreSQL Partial Index và Standard Composite Unique
  interface CandidateRecord {
    id: string;
    quizId: string;
    classId: string | null;
    studentId: string | null;
    codeDigest: string;
  }

  function validateUniqueness(records: CandidateRecord[], newRec: CandidateRecord): { ok: boolean; error?: string } {
    // 1. Khóa duy nhất theo mã thi codeDigest: @@unique([quizId, codeDigest])
    if (records.some((r) => r.quizId === newRec.quizId && r.codeDigest === newRec.codeDigest)) {
      return { ok: false, error: "Unique constraint failed on (quizId, codeDigest)" };
    }

    // 2. Học sinh theo lớp: @@unique([quizId, classId, studentId])
    if (newRec.classId !== null && newRec.studentId !== null) {
      if (records.some((r) => r.quizId === newRec.quizId && r.classId === newRec.classId && r.studentId === newRec.studentId)) {
        return { ok: false, error: "Unique constraint failed on (quizId, classId, studentId)" };
      }
    }

    // 3. PostgreSQL Partial Unique Index:
    // CREATE UNIQUE INDEX "QuizCandidate_quizId_studentId_unassigned_key" ON "QuizCandidate"("quizId", "studentId") WHERE "classId" IS NULL AND "studentId" IS NOT NULL;
    if (newRec.classId === null && newRec.studentId !== null) {
      if (records.some((r) => r.quizId === newRec.quizId && r.classId === null && r.studentId === newRec.studentId)) {
        return { ok: false, error: "Partial unique constraint failed on (quizId, studentId) where classId is null" };
      }
    }

    // 4. Khách vãng lai: (studentId IS NULL) -> Cho phép nhiều thí sinh tự do, duy nhất bởi codeDigest
    return { ok: true };
  }

  it("chặn cấp trùng đề thi cho cùng 1 học sinh trong cùng 1 lớp", () => {
    const records: CandidateRecord[] = [
      { id: "1", quizId: "q1", classId: "10A1", studentId: "s1", codeDigest: "d1" },
    ];
    const duplicate = { id: "2", quizId: "q1", classId: "10A1", studentId: "s1", codeDigest: "d2" };
    const res = validateUniqueness(records, duplicate);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("(quizId, classId, studentId)");
  });

  it("Partial Unique Index: chặn cấp trùng đề thi cho học sinh tự do (classId IS NULL)", () => {
    const records: CandidateRecord[] = [
      { id: "1", quizId: "q1", classId: null, studentId: "s1", codeDigest: "d1" },
    ];
    const duplicate = { id: "2", quizId: "q1", classId: null, studentId: "s1", codeDigest: "d2" };
    const res = validateUniqueness(records, duplicate);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Partial unique constraint");
  });

  it("cho phép nhiều thí sinh khách vãng lai độc lập (studentId IS NULL)", () => {
    const records: CandidateRecord[] = [
      { id: "1", quizId: "q1", classId: null, studentId: null, codeDigest: "guest-hash-1" },
    ];
    const newGuest = { id: "2", quizId: "q1", classId: null, studentId: null, codeDigest: "guest-hash-2" };
    const res = validateUniqueness(records, newGuest);
    expect(res.ok).toBe(true);
  });

  it("chặn trùng codeDigest cho khách vãng lai", () => {
    const records: CandidateRecord[] = [
      { id: "1", quizId: "q1", classId: null, studentId: null, codeDigest: "guest-hash-1" },
    ];
    const duplicateDigest = { id: "2", quizId: "q1", classId: null, studentId: null, codeDigest: "guest-hash-1" };
    const res = validateUniqueness(records, duplicateDigest);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("(quizId, codeDigest)");
  });
});
