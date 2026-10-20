"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { teacherClassIds } from "@/lib/teacher-classes";
import { generateExamCode, generatePaper, gradeWithLayout, isOverdue } from "@/lib/quiz-shuffle";
import {
  decryptCandidateCode,
  digestCandidateCode,
  digestCandidateSecret,
  encryptCandidateCode,
  generateBrowserBindingSecret,
  generateCandidateCode,
  getBindingExpiresAt,
  getCandidateCookieName,
  isBindingActive,
  type CandidateBindingExpiryMode,
} from "@/lib/quiz-candidate-access";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

type QuizAssignmentInput = {
  classId: string;
  deadlineOverride?: string | null;
  startsAtOverride?: string | null;
};

type NormalizedQuizAssignment = {
  classId: string;
  deadlineOverride: Date | null;
  startsAtOverride: Date | null;
};

type StudentWithClasses = {
  id: string;
  userId: string;
  classes: { id: string; name?: string | null }[];
};

type QuizAssignment = {
  classId: string;
  deadlineOverride: Date | null;
  startsAtOverride: Date | null;
  class?: { id: string; name: string } | null;
};

type QuizWithAssignments = {
  id: string;
  classId: string | null;
  deadline: Date | null;
  isPublic: boolean;
  answerVisibility: string;
  candidateAccessRequired?: boolean;
  candidateMaxSubmissions?: number;
  candidateBindingExpiryMode?: string;
  candidateBindingHours?: number | null;
  assignments?: QuizAssignment[];
};

type CandidateAccessContext = {
  id: string;
  name: string;
  classId: string | null;
  studentId: string | null;
  submittedCount: number;
  maxSubmissionsOverride: number | null;
};

type CandidateRosterInput = {
  // Internal rosters are generated from the classes assigned to the quiz.
  // Kept optional on input so existing callers can update ordinary quizzes.
  classIds?: string[];
};

type CandidateAccessSettings = {
  candidateAccessRequired?: boolean;
  candidateMaxSubmissions?: number;
  candidateBindingExpiryMode?: CandidateBindingExpiryMode;
  candidateBindingHours?: number | null | string;
  // Omit this on an ordinary protected-quiz edit to retain the issued roster.
  candidateRoster?: CandidateRosterInput;
};

type ResolvedQuizAccess = {
  allowed: boolean;
  error?: string;
  assignment: QuizAssignment | null;
  classId: string | null;
};

type CorrectAnswerItem = {
  id: string;
  correctAnswer: string;
  explanation: string | null;
};

type AnswerReviewState = {
  available: boolean;
  policy: string;
  message: string;
  availableAt: string | null;
};

type QuizAccessMode = "ACCOUNT" | "CANDIDATE" | "PUBLIC_GUEST";

interface SubmitQuizInput {
  quizId: string;
  answers: Record<string, string>; // Map of question ID to answer index string
  guestName?: string;
  timeExpired?: boolean;
  attemptId?: string; // mã đề (QuizAttempt) — chấm theo layout khi có
  classId?: string;
  accessMode?: QuizAccessMode;
}

async function getStudentProfileForSession(session: Session | null): Promise<StudentWithClasses | null> {
  if (!session || session.role !== "STUDENT") return null;

  return db.studentProfile.findUnique({
    where: { userId: session.userId },
    include: { classes: { select: { id: true, name: true } } },
  });
}

function getEffectiveDeadline(quiz: { deadline: Date | null }, assignment: QuizAssignment | null): Date | null {
  return assignment?.deadlineOverride ?? quiz.deadline ?? null;
}

function getEffectiveStartsAt(assignment: QuizAssignment | null): Date | null {
  return assignment?.startsAtOverride ?? null;
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function parseOptionalDate(value: string | null | undefined, label: string): { value: Date | null; error?: string } {
  if (!value) return { value: null };

  const date = new Date(value);
  if (!isValidDate(date)) {
    return { value: null, error: `${label} không hợp lệ.` };
  }

  return { value: date };
}

function normalizeQuizAssignments(input: {
  assignments?: QuizAssignmentInput[];
  classId?: string;
  isPublic?: boolean;
}): { assignments: NormalizedQuizAssignment[]; error?: string } {
  if (input.isPublic) {
    return { assignments: [] };
  }

  const rawAssignments = input.assignments && input.assignments.length > 0
    ? input.assignments
    : input.classId
      ? [{ classId: input.classId }]
      : [];

  const seenClassIds = new Set<string>();
  const assignments: NormalizedQuizAssignment[] = [];

  for (const assignment of rawAssignments) {
    const classId = assignment.classId.trim();
    if (!classId) continue;

    if (seenClassIds.has(classId)) {
      return { assignments: [], error: "Không được gán trùng lớp cho cùng một đề kiểm tra." };
    }
    seenClassIds.add(classId);

    const parsedDeadline = parseOptionalDate(assignment.deadlineOverride, "Deadline override");
    if (parsedDeadline.error) return { assignments: [], error: parsedDeadline.error };

    const parsedStartsAt = parseOptionalDate(assignment.startsAtOverride, "Thời gian mở đề override");
    if (parsedStartsAt.error) return { assignments: [], error: parsedStartsAt.error };

    if (parsedStartsAt.value && parsedDeadline.value && parsedStartsAt.value > parsedDeadline.value) {
      return { assignments: [], error: "Thời gian mở đề của lớp phải trước hoặc bằng deadline của lớp đó." };
    }

    assignments.push({
      classId,
      deadlineOverride: parsedDeadline.value,
      startsAtOverride: parsedStartsAt.value,
    });
  }

  return { assignments };
}

async function assertTeacherCanAssignClasses(session: Session, classIds: string[]): Promise<string | null> {
  if (session.role !== "TEACHER" || classIds.length === 0) return null;

  const owned = await teacherClassIds(session.userId);
  const unauthorizedClass = classIds.find((classId) => !owned.includes(classId));
  return unauthorizedClass ? "Bạn không được gán đề kiểm tra cho lớp không phụ trách." : null;
}

function chooseAssignmentForStudent(assignments: QuizAssignment[], studentProfile: StudentWithClasses): QuizAssignment | null {
  const studentClassIds = new Set(studentProfile.classes.map((item) => item.id));
  const matches = assignments.filter((assignment) => studentClassIds.has(assignment.classId));

  if (matches.length === 0) return null;

  return [...matches].sort((a, b) => {
    const aDeadline = a.deadlineOverride?.getTime() ?? Number.POSITIVE_INFINITY;
    const bDeadline = b.deadlineOverride?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aDeadline !== bDeadline) return aDeadline - bDeadline;
    return a.classId.localeCompare(b.classId);
  })[0];
}

function resolveQuizAssignmentForStudent(
  quiz: QuizWithAssignments,
  studentProfile: StudentWithClasses | null,
): ResolvedQuizAccess {
  if (quiz.isPublic) {
    return { allowed: true, assignment: null, classId: null };
  }

  if (!studentProfile) {
    return {
      allowed: false,
      error: "Đề thi này không công khai. Chỉ học sinh đã đăng nhập mới có quyền làm bài.",
      assignment: null,
      classId: null,
    };
  }

  const assignments = quiz.assignments ?? [];
  if (assignments.length > 0) {
    const assignment = chooseAssignmentForStudent(assignments, studentProfile);
    if (!assignment) {
      return {
        allowed: false,
        error: "Bài thi này dành riêng cho một lớp học cụ thể mà bạn không tham gia.",
        assignment: null,
        classId: null,
      };
    }

    return { allowed: true, assignment, classId: assignment.classId };
  }

  if (quiz.classId) {
    const isEnrolled = studentProfile.classes.some((item) => item.id === quiz.classId);
    if (!isEnrolled) {
      return {
        allowed: false,
        error: "Bài thi này dành riêng cho một lớp học cụ thể mà bạn không tham gia.",
        assignment: null,
        classId: null,
      };
    }

    return { allowed: true, assignment: null, classId: quiz.classId };
  }

  return { allowed: true, assignment: null, classId: null };
}

function createAnswerReviewState(
  policy: string,
  available: boolean,
  deadline: Date | null,
): AnswerReviewState {
  if (available) {
    return {
      available: true,
      policy,
      message: "Đáp án và lời giải đã sẵn sàng.",
      availableAt: null,
    };
  }

  switch (policy) {
    case "WHEN_ENDED":
      return {
        available: false,
        policy,
        message: deadline
          ? "Đáp án sẽ mở sau khi hết thời hạn làm đề thi."
          : "Đề này chưa đặt thời hạn kết thúc nên đáp án chưa được mở.",
        availableAt: deadline ? deadline.toISOString() : null,
      };
    case "AFTER_ALL_SUBMITTED":
      return {
        available: false,
        policy,
        message: deadline
          ? "Đáp án sẽ mở khi tất cả học sinh trong lớp đã nộp bài hoặc khi hết thời hạn làm đề thi."
          : "Đáp án sẽ mở khi tất cả học sinh trong lớp đã nộp bài.",
        availableAt: deadline ? deadline.toISOString() : null,
      };
    case "NEVER":
      return {
        available: false,
        policy,
        message: "Giáo viên chưa cho phép học viên xem đáp án và lời giải.",
        availableAt: null,
      };
    default:
      return {
        available: false,
        policy,
        message: "Đáp án chưa được mở theo cấu hình của đề thi.",
        availableAt: null,
      };
  }
}

/**
 * Quyết định có hiển thị đáp án sau khi nộp hay không.
 * - IMMEDIATELY: hiển thị ngay sau khi nộp bài.
 * - WHEN_ENDED: hiển thị khi đã qua deadline hiệu lực của đề/lớp.
 * - AFTER_ALL_SUBMITTED: đề private gắn lớp — hiển thị khi tất cả học sinh trong lớp hiệu lực đã nộp,
 *   hoặc khi đã qua deadline hiệu lực.
 * - NEVER: giữ tương thích dữ liệu cũ, không hiển thị.
 */
async function resolveAnswerReviewState(
  quiz: { id: string; answerVisibility: string },
  context: { classId: string | null; deadline: Date | null },
  now: Date = new Date(),
): Promise<AnswerReviewState> {
  switch (quiz.answerVisibility) {
    case "IMMEDIATELY":
      return createAnswerReviewState(quiz.answerVisibility, true, context.deadline);
    case "WHEN_ENDED": {
      const available = context.deadline ? now > context.deadline : false;
      return createAnswerReviewState(quiz.answerVisibility, available, context.deadline);
    }
    case "NEVER":
      return createAnswerReviewState(quiz.answerVisibility, false, context.deadline);
    case "AFTER_ALL_SUBMITTED": {
      if (!context.classId) {
        return createAnswerReviewState(quiz.answerVisibility, true, context.deadline);
      }
      if (context.deadline && now > context.deadline) {
        return createAnswerReviewState(quiz.answerVisibility, true, context.deadline);
      }

      const classInfo = await db.class.findUnique({
        where: { id: context.classId },
        select: { _count: { select: { students: true } } },
      });
      const studentCount = classInfo?._count.students ?? 0;
      if (studentCount === 0) {
        return createAnswerReviewState(quiz.answerVisibility, false, context.deadline);
      }

      const submitted = await db.quizSubmission.findMany({
        where: {
          quizId: quiz.id,
          studentId: { not: null },
          student: { classes: { some: { id: context.classId } } },
        },
        select: { studentId: true },
        distinct: ["studentId"],
      });
      return createAnswerReviewState(quiz.answerVisibility, submitted.length >= studentCount, context.deadline);
    }
    default:
      return createAnswerReviewState(quiz.answerVisibility, false, context.deadline);
  }
}

function normalizeQuestionOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.filter((option): option is string => typeof option === "string");
}

function buildLegacyCorrectAnswers(questions: { id: string; correctAnswer: string; explanation: string | null }[]): CorrectAnswerItem[] {
  return questions.map((q) => ({
    id: q.id,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
  }));
}

function buildLayoutCorrectAnswers(
  questions: { id: string; type: string; options: unknown; correctAnswer: string; score: number; explanation: string | null }[],
  layout: { questionOrder: Record<string, string[]>; optionOrder: Record<string, number[]> },
  answers: Record<string, string>,
): CorrectAnswerItem[] {
  const questionsById: Record<string, { id: string; type: string; options: string[]; correctAnswer: string; score: number; explanation: string | null }> = {};
  for (const q of questions) {
    questionsById[q.id] = {
      id: q.id,
      type: q.type,
      options: normalizeQuestionOptions(q.options),
      correctAnswer: q.correctAnswer,
      score: q.score,
      explanation: q.explanation,
    };
  }

  return gradeWithLayout(questionsById, layout, answers).correctAnswers;
}

function getEffectiveCandidateMaxSubmissions(
  candidate: Pick<CandidateAccessContext, "maxSubmissionsOverride">,
  quizMaxSubmissions: number,
): number {
  return candidate.maxSubmissionsOverride ?? quizMaxSubmissions;
}

function normalizeCandidateMaxSubmissionsOverride(value: unknown): { value: number | null; error?: string } {
  if (value === null) return { value: null };
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
    return { value: null, error: "Giới hạn lượt nộp riêng phải là số nguyên từ 0 đến 100." };
  }
  return { value };
}

function normalizeCandidateAccessSettings(input: CandidateAccessSettings & { isPublic?: boolean; deadline?: string | null }, assignmentCount: number): {
  enabled: boolean;
  maxSubmissions: number;
  expiryMode: CandidateBindingExpiryMode;
  bindingHours: number | null;
  error?: string;
} {
  const enabled = input.candidateAccessRequired === true;
  const maxSubmissions = Number(input.candidateMaxSubmissions ?? 1);
  const expiryMode = input.candidateBindingExpiryMode === "DEADLINE" ? "DEADLINE" : "HOURS";
  const bindingHours = input.candidateBindingHours == null || input.candidateBindingHours === ""
    ? null
    : Number(input.candidateBindingHours);

  if (!enabled) return { enabled, maxSubmissions: 1, expiryMode: "HOURS", bindingHours: null };
  if (input.isPublic) return { enabled, maxSubmissions, expiryMode, bindingHours, error: "Đề công khai không sử dụng mã dự thi." };
  if (assignmentCount === 0) return { enabled, maxSubmissions, expiryMode, bindingHours, error: "Chọn ít nhất một lớp được giao đề trước khi cấp mã dự thi." };
  if (!Number.isInteger(maxSubmissions) || maxSubmissions < 1 || maxSubmissions > 100) {
    return { enabled, maxSubmissions, expiryMode, bindingHours, error: "Số lượt nộp tối đa phải từ 1 đến 100." };
  }
  if (expiryMode === "DEADLINE" && !input.deadline) {
    return { enabled, maxSubmissions, expiryMode, bindingHours, error: "Chọn deadline cho đề trước khi dùng thời hạn khóa đến deadline." };
  }
  if (expiryMode === "HOURS" && (!Number.isInteger(bindingHours) || bindingHours! < 1 || bindingHours! > 720)) {
    return { enabled, maxSubmissions, expiryMode, bindingHours, error: "Thời hạn khóa trình duyệt phải từ 1 đến 720 giờ." };
  }

  return { enabled, maxSubmissions, expiryMode, bindingHours: expiryMode === "HOURS" ? bindingHours : null };
}

async function assertQuizManager(session: Session, quizId: string): Promise<{ error?: string; quiz?: { id: string; teacherId: string | null } }> {
  const quiz = await db.quiz.findUnique({ where: { id: quizId }, select: { id: true, teacherId: true } });
  if (!quiz) return { error: "Đề kiểm tra không tồn tại." };
  if (session.role === "ADMIN") return { quiz };
  if (session.role !== "TEACHER") return { error: "Bạn không có quyền quản lý danh sách thí sinh." };

  const teacher = await db.teacherProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!teacher || quiz.teacherId !== teacher.id) return { error: "Bạn không có quyền quản lý đề kiểm tra này." };
  return { quiz };
}

async function resolveRosterCandidates(session: Session, classIds: string[]): Promise<{
  candidates: { classId: string; studentId: string; name: string; source: "CLASS" }[];
  error?: string;
}> {
  const uniqueClassIds = [...new Set(classIds.map((id) => id.trim()).filter(Boolean))];
  const classAccessError = await assertTeacherCanAssignClasses(session, uniqueClassIds);
  if (classAccessError) return { candidates: [], error: classAccessError };
  if (uniqueClassIds.length === 0) return { candidates: [], error: "Chọn ít nhất một lớp để cấp mã dự thi." };

  const classes = await db.class.findMany({
    where: { id: { in: uniqueClassIds } },
    include: { students: { include: { user: { select: { name: true } } } } },
  });
  if (classes.length !== uniqueClassIds.length) return { candidates: [], error: "Có lớp học không tồn tại." };

  const candidates = classes.flatMap((classInfo) => classInfo.students.map((student) => ({
    classId: classInfo.id,
    studentId: student.id,
    name: student.user.name,
    source: "CLASS" as const,
  })));
  if (candidates.length > 1_000) return { candidates: [], error: "Danh sách chỉ được tối đa 1000 mã dự thi." };
  return { candidates };
}

async function syncQuizCandidates(
  tx: Pick<Prisma.TransactionClient, "quizCandidate">,
  quizId: string,
  candidates: { classId: string; studentId: string; name: string; source: "CLASS" }[],
): Promise<void> {
  const existing = await tx.quizCandidate.findMany({ where: { quizId } });
  const existingByClassStudent = new Map(
    existing.filter((item) => item.classId && item.studentId).map((item) => [`${item.classId}:${item.studentId}`, item]),
  );
  const retainedIds = new Set<string>();

  for (const candidate of candidates) {
    const matched = existingByClassStudent.get(`${candidate.classId}:${candidate.studentId}`);
    if (matched) {
      retainedIds.add(matched.id);
      await tx.quizCandidate.update({
        where: { id: matched.id },
        data: { name: candidate.name, source: candidate.source, isRevoked: false, revokedAt: null },
      });
      continue;
    }

    let code: string | null = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const generatedCode = generateCandidateCode();
      const conflict = await tx.quizCandidate.findFirst({
        where: { quizId, codeDigest: digestCandidateCode(generatedCode) },
      });
      if (!conflict) {
        code = generatedCode;
        break;
      }
    }
    if (!code) throw new Error("Không thể cấp mã dự thi duy nhất. Vui lòng thử lại.");

    const created = await tx.quizCandidate.create({
      data: {
        quizId,
        classId: candidate.classId,
        studentId: candidate.studentId,
        name: candidate.name,
        source: candidate.source,
        codeDigest: digestCandidateCode(code),
        codeCiphertext: encryptCandidateCode(code),
      },
      select: { id: true },
    });
    retainedIds.add(created.id);
  }

  await tx.quizCandidate.updateMany({
    where: { quizId, id: { notIn: [...retainedIds] }, isRevoked: false },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      bindingSecretDigest: null,
      bindingStartedAt: null,
      bindingExpiresAt: null,
    },
  });
}

async function getCandidateAccessContext(
  quiz: Pick<QuizWithAssignments, "id" | "isPublic" | "candidateAccessRequired" | "candidateMaxSubmissions">,
  options: { allowExhausted?: boolean } = {},
): Promise<{ context?: CandidateAccessContext; error?: string }> {
  // Legacy public candidate settings are deliberately ignored: public quizzes
  // are now open to guests and never require an exam code.
  if (quiz.isPublic || !quiz.candidateAccessRequired) return {};
  const cookieStore = await cookies();
  const raw = cookieStore.get(getCandidateCookieName(quiz.id))?.value;
  const [candidateId, bindingSecret, extraPart] = raw?.split(".") ?? [];
  if (!candidateId || !bindingSecret || extraPart) {
    return { error: "Vui lòng nhập mã dự thi trước khi làm bài." };
  }

  const candidate = await db.quizCandidate.findFirst({
    where: { id: candidateId, quizId: quiz.id, isRevoked: false },
    select: { id: true, name: true, classId: true, studentId: true, submittedCount: true, maxSubmissionsOverride: true, bindingSecretDigest: true, bindingExpiresAt: true },
  });
  if (!candidate || !candidate.bindingSecretDigest || !isBindingActive(candidate.bindingExpiresAt)) {
    cookieStore.delete(getCandidateCookieName(quiz.id));
    return { error: "Phiên mã dự thi đã hết hạn hoặc đã bị thu hồi. Vui lòng liên hệ giáo viên." };
  }
  if (digestCandidateSecret(bindingSecret) !== candidate.bindingSecretDigest) {
    cookieStore.delete(getCandidateCookieName(quiz.id));
    return { error: "Phiên mã dự thi không hợp lệ. Vui lòng liên hệ giáo viên để được gỡ khóa." };
  }
  const maxSubmissions = getEffectiveCandidateMaxSubmissions(candidate, quiz.candidateMaxSubmissions ?? 1);
  if (!options.allowExhausted && candidate.submittedCount >= maxSubmissions) {
    return { error: "Mã dự thi này đã dùng hết số lượt nộp được phép." };
  }

  return { context: candidate };
}

export async function getActiveQuizCandidate(quizId: string) {
  try {
    if (typeof quizId !== "string") return { success: false, error: "Đề thi không hợp lệ." };
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        isPublic: true,
        candidateAccessRequired: true,
        candidateMaxSubmissions: true,
      },
    });
    if (!quiz?.candidateAccessRequired || quiz.isPublic) return { success: true, data: null };

    const access = await getCandidateAccessContext(quiz, { allowExhausted: true });
    if (!access.context) return { success: true, data: null };

    return {
      success: true,
      data: {
        name: access.context.name,
        remainingSubmissions: Math.max(
          0,
          getEffectiveCandidateMaxSubmissions(access.context, quiz.candidateMaxSubmissions) - access.context.submittedCount,
        ),
      },
    };
  } catch (error) {
    console.error("Error loading active quiz candidate:", error);
    return { success: false, error: "Không thể kiểm tra phiên mã dự thi." };
  }
}

function normalizeAnswerVisibility(input: string | undefined, isPublic: boolean | undefined, classIds: string[]): string {
  if (input === "WHEN_ENDED") return "WHEN_ENDED";
  if (input === "AFTER_ALL_SUBMITTED") {
    return isPublic || classIds.length === 0 ? "IMMEDIATELY" : "AFTER_ALL_SUBMITTED";
  }
  if (input === "NEVER") return "WHEN_ENDED";
  return "IMMEDIATELY";
}

export async function activateQuizCandidateCode(quizId: string, code: string, classId: string, confirmedName: string) {
  try {
    if (typeof quizId !== "string" || typeof code !== "string" || typeof classId !== "string" || typeof confirmedName !== "string") {
      return { success: false, error: "Mã dự thi không hợp lệ." };
    }
    const normalizedClassId = classId.trim();
    const normalizedName = confirmedName.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
    if (!normalizedClassId || !normalizedName) return { success: false, error: "Vui lòng xác nhận đầy đủ lớp và họ tên." };
    const normalizedDigest = digestCandidateCode(code);
    if (!normalizedDigest || !code.trim()) return { success: false, error: "Vui lòng nhập mã dự thi." };

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        isPublic: true,
        assignments: { select: { classId: true } },
        deadline: true,
        candidateAccessRequired: true,
        candidateMaxSubmissions: true,
        candidateBindingExpiryMode: true,
        candidateBindingHours: true,
      },
    });
    if (!quiz || quiz.isPublic || !quiz.candidateAccessRequired || !quiz.assignments.some((assignment) => assignment.classId === normalizedClassId)) {
      return { success: false, error: "Đề thi này không sử dụng mã dự thi cho lớp đã chọn." };
    }

    const cookieStore = await cookies();
    const cookieName = getCandidateCookieName(quizId);
    const browserCookie = cookieStore.get(cookieName)?.value;
    const [existingCandidateId, existingSecret, existingExtraPart] = browserCookie?.split(".") ?? [];
    let activeBrowserCandidateId: string | null = null;
    let activeBrowserSecret: string | null = null;
    if (existingCandidateId && existingSecret && !existingExtraPart) {
      const existingCandidate = await db.quizCandidate.findFirst({
        where: { id: existingCandidateId, quizId, isRevoked: false },
        select: { id: true, bindingSecretDigest: true, bindingExpiresAt: true },
      });
      if (existingCandidate && isBindingActive(existingCandidate.bindingExpiresAt) && existingCandidate.bindingSecretDigest === digestCandidateSecret(existingSecret)) {
        activeBrowserCandidateId = existingCandidate.id;
        activeBrowserSecret = existingSecret;
      } else {
        cookieStore.delete(cookieName);
      }
    } else if (browserCookie) {
      cookieStore.delete(cookieName);
    }

    const candidate = await db.quizCandidate.findFirst({
      where: { quizId, classId: normalizedClassId, codeDigest: normalizedDigest, isRevoked: false },
      select: { id: true, name: true, studentId: true, submittedCount: true, maxSubmissionsOverride: true, bindingSecretDigest: true, bindingExpiresAt: true },
    });
    if (!candidate) return { success: false, error: "Mã dự thi không đúng, sai lớp hoặc đã bị thu hồi." };
    if (!candidate.studentId || candidate.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi") !== normalizedName) {
      return { success: false, error: "Họ tên xác nhận không khớp với mã dự thi của lớp này." };
    }
    if (activeBrowserCandidateId && activeBrowserCandidateId !== candidate.id) {
      return { success: false, error: "Trình duyệt này đang được liên kết với một mã dự thi khác. Hãy liên hệ giáo viên để gỡ khóa." };
    }
    const maxSubmissions = getEffectiveCandidateMaxSubmissions(candidate, quiz.candidateMaxSubmissions);
    if (candidate.submittedCount >= maxSubmissions) {
      return { success: false, error: "Mã dự thi này đã dùng hết số lượt nộp được phép." };
    }

    const now = new Date();
    if (candidate.bindingSecretDigest && isBindingActive(candidate.bindingExpiresAt, now)) {
      if (candidate.id !== activeBrowserCandidateId || candidate.bindingSecretDigest !== digestCandidateSecret(activeBrowserSecret ?? "")) {
        return { success: false, error: "Mã dự thi này đang được sử dụng trên một trình duyệt khác. Hãy liên hệ giáo viên để gỡ khóa." };
      }
      cookieStore.set(cookieName, browserCookie!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: candidate.bindingExpiresAt!,
        path: "/",
      });
      return { success: true, data: { name: candidate.name, remainingSubmissions: maxSubmissions - candidate.submittedCount } };
    }

    const bindingExpiresAt = getBindingExpiresAt({
      mode: quiz.candidateBindingExpiryMode === "DEADLINE" ? "DEADLINE" : "HOURS",
      hours: quiz.candidateBindingHours,
      deadline: quiz.deadline,
      now,
    });
    if (!bindingExpiresAt) return { success: false, error: "Cấu hình thời hạn mã dự thi không hợp lệ. Vui lòng liên hệ giáo viên." };

    const secret = generateBrowserBindingSecret();
    const claimed = await db.quizCandidate.updateMany({
      where: {
        id: candidate.id,
        OR: [{ bindingExpiresAt: null }, { bindingExpiresAt: { lte: now } }],
      },
      data: {
        bindingSecretDigest: digestCandidateSecret(secret),
        bindingStartedAt: now,
        bindingExpiresAt,
      },
    });
    if (claimed.count !== 1) {
      return { success: false, error: "Mã dự thi này vừa được liên kết với trình duyệt khác. Vui lòng thử lại hoặc liên hệ giáo viên." };
    }

    cookieStore.set(cookieName, `${candidate.id}.${secret}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: bindingExpiresAt,
      path: "/",
    });
    return { success: true, data: { name: candidate.name, remainingSubmissions: maxSubmissions - candidate.submittedCount } };
  } catch (error) {
    console.error("Error activating quiz candidate code:", error);
    return { success: false, error: "Không thể xác thực mã dự thi lúc này." };
  }
}

export async function submitQuiz(input: SubmitQuizInput) {
  try {
    const session = await getSession();

    const quiz = await db.quiz.findUnique({
      where: { id: input.quizId },
      include: { questions: true, assignments: { include: { class: true } } },
    });

    if (!quiz) {
      return { success: false, error: "Đề kiểm tra trắc nghiệm không tồn tại." };
    }

    const studentProfile = await getStudentProfileForSession(session);
    const requestedMode: QuizAccessMode = input.accessMode ?? (quiz.isPublic ? "PUBLIC_GUEST" : "ACCOUNT");
    const access = requestedMode === "CANDIDATE"
      ? { allowed: true, assignment: null, classId: null }
      : resolveQuizAssignmentForStudent(quiz, studentProfile);
    if (!access.allowed) {
      return { success: false, error: access.error ?? "Bạn không có quyền làm bài thi này." };
    }
    // Allow a prior successful submission to remain idempotent even after it
    // consumed the candidate's final allowed submission; the transaction below
    // remains the authoritative cap enforcement for new submissions.
    const candidateAccess = requestedMode === "CANDIDATE"
      ? await getCandidateAccessContext(quiz, { allowExhausted: true })
      : {};
    if (candidateAccess.error) return { success: false, error: candidateAccess.error };
    const candidate = candidateAccess.context;
    if (requestedMode === "CANDIDATE" && (!candidate?.studentId || !candidate?.classId)) {
      return { success: false, error: "Mã dự thi chưa được xác thực cho học sinh và lớp hợp lệ." };
    }
    if (requestedMode === "ACCOUNT" && !studentProfile && !quiz.isPublic) {
      return { success: false, error: "Vui lòng đăng nhập bằng tài khoản học sinh để làm đề nội bộ." };
    }

    // Guest name validation for public quizzes
    // Guest (chưa đăng nhập) bắt buộc nhập họ tên. User đã đăng nhập (kể cả
    // không phải STUDENT) luôn có định danh session → không cần guestName.
    if (!candidate && !session && !studentProfile && quiz.isPublic && !input.guestName?.trim()) {
      return { success: false, error: "Vui lòng nhập Họ tên để bắt đầu làm bài thi thử công khai." };
    }

    // ── Chấm điểm ──────────────────────────────────────────────────────────
    let totalScore = 0;
    let maxScore = 0;
    let correctAnswersData: { id: string; correctAnswer: string; explanation: string | null }[] | null = null;
    let isTimedOut = false;
    let attempt = null;
    let attemptStatus: "SUBMITTED" | "TIMED_OUT" | null = null;

    if (input.attemptId) {
      // Mã đề: chấm theo layout (display → original), không tin answers từ client
      attempt = await db.quizAttempt.findUnique({
        where: { id: input.attemptId },
        include: { quiz: { include: { questions: true } } },
      });

      if (!attempt) {
        return { success: false, error: "Mã đề làm bài không tồn tại. Vui lòng làm lại." };
      }
      if (attempt.quizId !== quiz.id) {
        return { success: false, error: "Mã đề này không khớp với đề kiểm tra." };
      }
      if (attempt.studentId !== (candidate ? candidate.studentId : (studentProfile ? studentProfile.id : null))) {
        return { success: false, error: "Mã đề này không thuộc về bạn." };
      }
      if ((attempt.candidateId ?? null) !== (candidate?.id ?? null)) {
        return { success: false, error: "Mã đề này không thuộc về phương thức truy cập hiện tại." };
      }

      const layout = attempt.layout as { questionOrder: Record<string, string[]>; optionOrder: Record<string, number[]> };
      const graded = gradeWithLayout(
        Object.fromEntries(
          attempt.quiz.questions.map((q) => [
            q.id,
            { id: q.id, type: q.type, options: normalizeQuestionOptions(q.options), correctAnswer: q.correctAnswer, score: q.score, explanation: q.explanation },
          ]),
        ),
        layout,
        input.answers,
      );
      totalScore = graded.totalScore;
      maxScore = graded.maxScore;
      correctAnswersData = graded.correctAnswers;

      isTimedOut = isOverdue(attempt.endsAt);
      attemptStatus = isTimedOut ? "TIMED_OUT" : "SUBMITTED";
    } else {
      // Legacy path (test / không mã đề): chấm trực tiếp như trước
      for (const question of quiz.questions) {
        maxScore += question.score;
        const studentAnswer = (input.answers[question.id] || "").trim().toUpperCase();
        const correctAnswer = (question.correctAnswer || "").trim().toUpperCase();

        if (question.type === "TRUE_FALSE") {
          const studentParts = studentAnswer.split(",");
          const correctParts = correctAnswer.split(",");
          let subCorrect = 0;
          for (let i = 0; i < Math.min(studentParts.length, correctParts.length); i++) {
            if (studentParts[i] && correctParts[i] && studentParts[i].trim() === correctParts[i].trim()) {
              subCorrect++;
            }
          }
          let scoreRatio = 0;
          if (subCorrect === 1) scoreRatio = 0.1;
          else if (subCorrect === 2) scoreRatio = 0.25;
          else if (subCorrect === 3) scoreRatio = 0.5;
          else if (subCorrect === 4) scoreRatio = 1.0;

          totalScore += scoreRatio * question.score;
        } else {
          if (studentAnswer === correctAnswer) {
            totalScore += question.score;
          }
        }
      }
    }

    // Check if submitted after effective deadline — flag as late, still accept (không chặn)
    let targetClassId: string | null = null;
    if (attempt?.classId) {
      targetClassId = attempt.classId;
    } else if (candidate?.classId) {
      targetClassId = candidate.classId;
    } else if (input.classId?.trim()) {
      const requestedClassId = input.classId.trim();
      if (studentProfile) {
        const isEnrolled = studentProfile.classes.some((c) => c.id === requestedClassId);
        if (isEnrolled || quiz.isPublic) {
          targetClassId = requestedClassId;
        } else {
          targetClassId = access.classId;
        }
      } else if (quiz.isPublic) {
        targetClassId = requestedClassId;
      } else {
        targetClassId = access.classId;
      }
    } else {
      targetClassId = access.classId;
    }

    const targetAssignment = targetClassId
      ? quiz.assignments.find((a) => a.classId === targetClassId) ?? access.assignment
      : access.assignment;
    const effectiveDeadline = getEffectiveDeadline(quiz, targetAssignment);
    const isLate = (effectiveDeadline ? new Date() > effectiveDeadline : false) || isTimedOut;

    if (attempt) {
      const existingSubmission = await db.quizSubmission.findUnique({
        where: { attemptId: attempt.id },
      });

      if (existingSubmission) {
        const answerReview = await resolveAnswerReviewState(quiz, {
          classId: existingSubmission.classId,
          deadline: effectiveDeadline,
        });
        const existingAnswers = existingSubmission.answers as Record<string, string>;
        const existingCorrectAnswers = answerReview.available
          ? buildLayoutCorrectAnswers(
              quiz.questions,
              attempt.layout as { questionOrder: Record<string, string[]>; optionOrder: Record<string, number[]> },
              existingAnswers,
            )
          : null;

        return {
          success: true,
          data: {
            score: existingSubmission.score,
            maxScore,
            passed: existingSubmission.score >= quiz.passingScore,
            submissionId: existingSubmission.id,
            isLate: existingSubmission.isLate,
            correctAnswers: existingCorrectAnswers,
            answerReview,
          },
        };
      }
    }

    let submission;
    try {
      submission = await db.$transaction(async (tx) => {
        if (candidate) {
          const incremented = await tx.$executeRaw(
            Prisma.sql`
              UPDATE "QuizCandidate"
              SET "submittedCount" = "submittedCount" + 1,
                  "updatedAt" = CURRENT_TIMESTAMP
              WHERE "id" = ${candidate.id}
                AND "quizId" = ${quiz.id}
                AND "isRevoked" = false
                AND "submittedCount" < COALESCE("maxSubmissionsOverride", ${quiz.candidateMaxSubmissions})
            `,
          );
          if (incremented !== 1) {
            throw new Error("CANDIDATE_SUBMISSION_LIMIT");
          }
        }
        if (attempt && attemptStatus) {
          await tx.quizAttempt.update({
            where: { id: attempt.id },
            data: { status: attemptStatus, submittedAt: new Date() },
          });
        }
        return tx.quizSubmission.create({
          data: {
            studentId: candidate ? candidate.studentId : (studentProfile ? studentProfile.id : null),
            quizId: quiz.id,
            score: totalScore,
            answers: JSON.parse(JSON.stringify(input.answers)),
            guestName: candidate ? null : (studentProfile ? null : input.guestName?.trim()),
            isLate,
            attemptId: attempt ? attempt.id : null,
            classId: targetClassId,
            candidateId: candidate?.id ?? null,
          },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "CANDIDATE_SUBMISSION_LIMIT") {
        return { success: false, error: "Mã dự thi này đã dùng hết số lượt nộp được phép." };
      }
      throw error;
    }

    // An internal candidate code is bound to a rostered StudentProfile, so it
    // has the same academic identity as an authenticated student submission.
    const gradeStudentId = candidate?.studentId ?? studentProfile?.id ?? null;
    if (gradeStudentId) {
      // Find fallback teacher if quiz has no teacherId (created by Admin)
      let finalTeacherId = quiz.teacherId;
      if (!finalTeacherId) {
        const fallbackTeacher = await db.teacherProfile.findFirst();
        finalTeacherId = fallbackTeacher ? fallbackTeacher.id : null;
      }

      await db.grade.create({
        data: {
          studentId: gradeStudentId,
          subjectId: quiz.subjectId,
          teacherId: finalTeacherId || "",
          type: "QUIZ",
          score: totalScore,
          weight: 0.1,
          remarks: `Điểm thi trắc nghiệm trực tuyến: ${quiz.title}`,
        },
      });
    }

    revalidatePath("/student/grades");
    revalidatePath("/student");
    revalidatePath("/parent");

    const passed = totalScore >= quiz.passingScore;

    const answerReview = await resolveAnswerReviewState(quiz, {
      classId: targetClassId,
      deadline: effectiveDeadline,
    });

    const finalCorrectAnswers = answerReview.available
      ? (correctAnswersData ?? buildLegacyCorrectAnswers(quiz.questions))
      : null;

    return {
      success: true,
      data: {
        score: totalScore,
        maxScore,
        passed,
        submissionId: submission.id,
        isLate,
        correctAnswers: finalCorrectAnswers,
        answerReview,
      }
    };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi chấm bài thi trắc nghiệm." };
  }
}

export async function getQuizAnswerReview(submissionId: string, answerReviewToken?: string) {
  try {
    const session = await getSession();
    const studentProfile = await getStudentProfileForSession(session);

    const submission = await db.quizSubmission.findUnique({
      where: { id: submissionId },
      include: {
        attempt: true,
        quiz: {
          include: {
            questions: true,
            assignments: { include: { class: true } },
          },
        },
      },
    });

    if (!submission) {
      return { success: false, error: "Không tìm thấy bài nộp." };
    }

    if (submission.candidateId) {
      const candidateAccess = await getCandidateAccessContext(submission.quiz, { allowExhausted: true });
      if (!candidateAccess.context || candidateAccess.context.id !== submission.candidateId) {
        return { success: false, error: "Bạn không có quyền xem đáp án của bài nộp này." };
      }
    } else if (submission.studentId) {
      if (submission.studentId !== studentProfile?.id) {
        return { success: false, error: "Bạn không có quyền xem đáp án của bài nộp này." };
      }
    } else if (!submission.attemptId || submission.attemptId !== answerReviewToken) {
      return { success: false, error: "Bạn không có quyền xem đáp án của bài nộp này." };
    }

    const targetAssignment = submission.classId
      ? submission.quiz.assignments.find((a) => a.classId === submission.classId) ?? null
      : null;
    const effectiveDeadline = getEffectiveDeadline(submission.quiz, targetAssignment);
    const answerReview = await resolveAnswerReviewState(submission.quiz, {
      classId: submission.classId,
      deadline: effectiveDeadline,
    });

    if (!answerReview.available) {
      return { success: true, data: { correctAnswers: null, answerReview } };
    }

    const answers = submission.answers as Record<string, string>;
    const correctAnswers = submission.attempt
      ? buildLayoutCorrectAnswers(
          submission.quiz.questions,
          submission.attempt.layout as { questionOrder: Record<string, string[]>; optionOrder: Record<string, number[]> },
          answers,
        )
      : buildLegacyCorrectAnswers(submission.quiz.questions);

    return { success: true, data: { correctAnswers, answerReview } };
  } catch (error) {
    console.error("Error loading quiz answer review:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tải đáp án." };
  }
}

interface StartQuizAttemptInput {
  quizId: string;
  guestName?: string;
  classId?: string;
  accessMode?: QuizAccessMode;
}

/**
 * Bắt đầu làm bài: server tạo mã đề xáo trộn (QuizAttempt) và trả về paper
 * (câu theo thứ tự hiển thị, KHÔNG kèm correctAnswer/explanation để không
 * rò rỉ vào bundle). Thứ tự gốc & đáp án chỉ nằm trên server (layout).
 */
export async function startQuizAttempt(input: StartQuizAttemptInput) {
  try {
    const session = await getSession();

    const quiz = await db.quiz.findUnique({
      where: { id: input.quizId },
      include: { questions: true, assignments: { include: { class: true } } },
    });
    if (!quiz) {
      return { success: false, error: "Đề kiểm tra trắc nghiệm không tồn tại." };
    }

    const studentProfile = await getStudentProfileForSession(session);
    const requestedMode: QuizAccessMode = input.accessMode ?? (quiz.isPublic ? "PUBLIC_GUEST" : "ACCOUNT");
    const access = requestedMode === "CANDIDATE"
      ? { allowed: true, assignment: null, classId: null }
      : resolveQuizAssignmentForStudent(quiz, studentProfile);
    if (!access.allowed) {
      return { success: false, error: access.error ?? "Bạn không có quyền làm bài thi này." };
    }
    const candidateAccess = requestedMode === "CANDIDATE" ? await getCandidateAccessContext(quiz) : {};
    if (candidateAccess.error) return { success: false, error: candidateAccess.error };
    const candidate = candidateAccess.context;
    if (requestedMode === "CANDIDATE" && (!candidate?.studentId || !candidate.classId)) {
      return { success: false, error: "Mã dự thi chưa được xác thực cho học sinh và lớp hợp lệ." };
    }
    if (requestedMode === "ACCOUNT" && !studentProfile && !quiz.isPublic) {
      return { success: false, error: "Vui lòng đăng nhập bằng tài khoản học sinh để làm đề nội bộ." };
    }

    // Guests must identify themselves only for public quizzes.
    if (requestedMode === "PUBLIC_GUEST" && !session && !studentProfile && !input.guestName?.trim()) {
      return { success: false, error: "Vui lòng nhập Họ tên để bắt đầu làm bài thi thử công khai." };
    }

    let targetClassId: string | null = null;
    if (candidate?.classId) {
      targetClassId = candidate.classId;
    } else if (input.classId?.trim()) {
      const requestedClassId = input.classId.trim();
      if (studentProfile) {
        const isEnrolled = studentProfile.classes.some((c) => c.id === requestedClassId);
        if (isEnrolled || quiz.isPublic) {
          targetClassId = requestedClassId;
        } else {
          targetClassId = access.classId;
        }
      } else if (quiz.isPublic) {
        targetClassId = requestedClassId;
      } else {
        targetClassId = access.classId;
      }
    } else {
      targetClassId = access.classId;
    }

    const targetAssignment = targetClassId
      ? quiz.assignments.find((a) => a.classId === targetClassId) ?? access.assignment
      : access.assignment;
    const effectiveStartsAt = getEffectiveStartsAt(targetAssignment);
    if (effectiveStartsAt && effectiveStartsAt > new Date()) {
      return { success: false, error: "Đề thi chưa mở cho lớp của bạn." };
    }

    const questions: import("@/lib/quiz-shuffle").ShuffleQuestion[] = quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      correctAnswer: q.correctAnswer,
      score: q.score,
      explanation: q.explanation,
      imageUrl: q.imageUrl,
    }));

    const { layout, paperQuestions } = generatePaper(questions, quiz.shuffleQuestions);

    // Sinh mã đề 4 ký tự duy nhất (thử tối đa vài lần, unique index bảo vệ)
    let examCode = generateExamCode();
    for (let i = 0; i < 5; i++) {
      const clash = await db.quizAttempt.findFirst({ where: { examCode } });
      if (!clash) break;
      examCode = generateExamCode();
    }

    const now = new Date();
    const attempt = await db.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: candidate ? candidate.studentId : (studentProfile ? studentProfile.id : null),
        candidateId: candidate?.id ?? null,
        guestName: candidate ? null : (studentProfile ? null : input.guestName?.trim()),
        examCode,
        layout: layout as object,
        startsAt: now,
        endsAt: new Date(now.getTime() + quiz.duration * 60 * 1000),
        classId: targetClassId,
      },
    });

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        examCode: attempt.examCode,
        endsAt: attempt.endsAt.toISOString(),
        questions: paperQuestions,
      },
    };
  } catch (error) {
    console.error("Error starting quiz attempt:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi bắt đầu làm bài." };
  }
}

interface CreateQuizInput extends CandidateAccessSettings {
  title: string;
  description?: string;
  duration: number;
  passingScore: number;
  deadline?: string | null; // ISO string, null = không đóng đề
  subjectId: string;
  classId?: string;
  assignments?: QuizAssignmentInput[];
  isPublic?: boolean;
  answerVisibility?: string; // IMMEDIATELY, WHEN_ENDED, AFTER_ALL_SUBMITTED
  shuffleQuestions?: boolean; // Xáo trộn câu hỏi & đáp án mỗi lượt làm bài
  questions: {
    questionText: string;
    type?: string;
    options: string[];
    correctAnswer: string;
    score?: number;
    explanation?: string;
    imageUrl?: string;
  }[];
}

export async function createQuiz(input: CreateQuizInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Chỉ quản trị viên hoặc giảng viên mới được tạo đề kiểm tra." };
    }

    let teacherId: string | null = null;
    if (session.role === "TEACHER") {
      const teacher = await db.teacherProfile.findUnique({
        where: { userId: session.userId },
        include: { subjects: true },
      });
      if (!teacher) {
        return { success: false, error: "Hồ sơ giảng viên của bạn không tồn tại." };
      }
      teacherId = teacher.id;
    }

    const { title, description, duration, passingScore, deadline, subjectId, isPublic, answerVisibility, shuffleQuestions, questions } = input;

    if (!title || isNaN(duration) || isNaN(passingScore) || !subjectId || questions.length === 0) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin đề thi và ít nhất 1 câu hỏi." };
    }

    const parsedDeadline = parseOptionalDate(deadline, "Deadline mặc định");
    if (parsedDeadline.error) return { success: false, error: parsedDeadline.error };
    const normalizedAssignments = normalizeQuizAssignments(input);
    if (normalizedAssignments.error) return { success: false, error: normalizedAssignments.error };
    const candidateSettings = normalizeCandidateAccessSettings(input, normalizedAssignments.assignments.length);
    if (input.candidateAccessRequired && input.candidateBindingExpiryMode === "DEADLINE" && !parsedDeadline.value) {
      return { success: false, error: "Chọn deadline cho đề trước khi dùng thời hạn khóa đến deadline." };
    }
    if (candidateSettings.error) return { success: false, error: candidateSettings.error };
    const roster = candidateSettings.enabled ? await resolveRosterCandidates(session, normalizedAssignments.assignments.map((assignment) => assignment.classId)) : { candidates: [] };
    if (roster.error) return { success: false, error: roster.error };


    const classIds = normalizedAssignments.assignments.map((assignment) => assignment.classId);
    const assignmentError = await assertTeacherCanAssignClasses(session, classIds);
    if (assignmentError) return { success: false, error: assignmentError };

    const finalVisibility = normalizeAnswerVisibility(answerVisibility, isPublic, classIds);

    const legacyClassId = classIds[0] ?? null;

    const quiz = await db.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          description: description || null,
          duration,
          passingScore,
          deadline: parsedDeadline.value,
          subjectId,
          classId: legacyClassId,
          isPublic: isPublic || false,
          answerVisibility: finalVisibility,
          shuffleQuestions: shuffleQuestions ?? true,
          candidateAccessRequired: candidateSettings.enabled,
          candidateMaxSubmissions: candidateSettings.maxSubmissions,
          candidateBindingExpiryMode: candidateSettings.expiryMode,
          candidateBindingHours: candidateSettings.bindingHours,
          teacherId,
        },
      });

      for (const assignment of normalizedAssignments.assignments) {
        await tx.quizClassAssignment.create({
          data: {
            quizId: newQuiz.id,
            classId: assignment.classId,
            deadlineOverride: assignment.deadlineOverride,
            startsAtOverride: assignment.startsAtOverride,
          },
        });
      }

      if (candidateSettings.enabled) {
        await syncQuizCandidates(tx, newQuiz.id, roster.candidates);
      }

      for (const q of questions) {
        await tx.question.create({
          data: {
            quizId: newQuiz.id,
            text: q.questionText,
            type: q.type || "MULTIPLE_CHOICE",
            options: q.options,
            correctAnswer: q.correctAnswer,
            score: q.score ?? 1.0,
            explanation: q.explanation || null,
            imageUrl: q.imageUrl || null,
          },
        });
      }

      return newQuiz;
    });

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    revalidatePath("/student/quizzes");
    revalidatePath("/quizzes");
    return { success: true, data: quiz };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tạo đề kiểm tra." };
  }
}

export async function deleteQuiz(quizId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Chỉ quản trị viên hoặc giảng viên mới được xoá đề kiểm tra." };
    }

    // TEACHER: chỉ xóa quiz mình tạo
    if (session.role === "TEACHER") {
      const teacher = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      const quiz = await db.quiz.findUnique({ where: { id: quizId } });
      if (!quiz) return { success: false, error: "Đề kiểm tra không tồn tại." };
      if (!teacher || quiz.teacherId !== teacher.id) {
        return { success: false, error: "Bạn không có quyền xoá đề kiểm tra này." };
      }
    }

    await db.quiz.delete({
      where: { id: quizId },
    });

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    revalidatePath("/student/quizzes");
    revalidatePath("/quizzes");
    return { success: true, message: "Xoá đề kiểm tra thành công." };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá đề kiểm tra." };
  }
}

interface UpdateQuizInput extends CreateQuizInput {
  id: string;
}

export async function updateQuiz(input: UpdateQuizInput) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Chỉ quản trị viên hoặc giảng viên mới được sửa đề kiểm tra." };
    }

    const { id, title, description, duration, passingScore, deadline, subjectId, isPublic, answerVisibility, shuffleQuestions, questions } = input;

    const parsedDeadline = parseOptionalDate(deadline, "Deadline mặc định");
    if (parsedDeadline.error) return { success: false, error: parsedDeadline.error };
    const normalizedAssignments = normalizeQuizAssignments(input);
    if (normalizedAssignments.error) return { success: false, error: normalizedAssignments.error };
    const candidateSettings = normalizeCandidateAccessSettings(input, normalizedAssignments.assignments.length);
    if (input.candidateAccessRequired && input.candidateBindingExpiryMode === "DEADLINE" && !parsedDeadline.value) {
      return { success: false, error: "Chọn deadline cho đề trước khi dùng thời hạn khóa đến deadline." };
    }
    if (candidateSettings.error) return { success: false, error: candidateSettings.error };

    const existingQuiz = await db.quiz.findUnique({
      where: { id },
      select: { teacherId: true, candidateAccessRequired: true },
    });
    if (!existingQuiz) return { success: false, error: "Đề kiểm tra không tồn tại." };

    const classIds = normalizedAssignments.assignments.map((assignment) => assignment.classId);

    // TEACHER: chỉ sửa quiz mình tạo + class ownership
    if (session.role === "TEACHER") {
      const teacher = await db.teacherProfile.findUnique({
        where: { userId: session.userId },
        include: { subjects: true },
      });
      if (!teacher || existingQuiz.teacherId !== teacher.id) {
        return { success: false, error: "Bạn không có quyền sửa đề kiểm tra này." };
      }
    }

    const assignmentError = await assertTeacherCanAssignClasses(session, classIds);
    if (assignmentError) return { success: false, error: assignmentError };

    // Rebuild from the current assigned classes whenever protected access is
    // enabled. syncQuizCandidates preserves codes for unchanged class/student pairs.
    const shouldSyncCandidateRoster = candidateSettings.enabled;
    const roster = shouldSyncCandidateRoster
      ? await resolveRosterCandidates(session, classIds)
      : { candidates: [] };
    if (roster.error) return { success: false, error: roster.error };

    const finalVisibility = normalizeAnswerVisibility(answerVisibility, isPublic, classIds);

    const legacyClassId = classIds[0] ?? null;

    await db.$transaction(async (tx) => {
      // 1. Update quiz basic info
      await tx.quiz.update({
        where: { id },
        data: {
          title,
          description: description || null,
          duration,
          passingScore,
          deadline: parsedDeadline.value,
          subjectId,
          classId: legacyClassId,
          isPublic: isPublic || false,
          answerVisibility: finalVisibility,
          shuffleQuestions: shuffleQuestions ?? true,
          candidateAccessRequired: candidateSettings.enabled,
          candidateMaxSubmissions: candidateSettings.maxSubmissions,
          candidateBindingExpiryMode: candidateSettings.expiryMode,
          candidateBindingHours: candidateSettings.bindingHours,
        },
      });

      await tx.quizClassAssignment.deleteMany({
        where: { quizId: id },
      });

      for (const assignment of normalizedAssignments.assignments) {
        await tx.quizClassAssignment.create({
          data: {
            quizId: id,
            classId: assignment.classId,
            deadlineOverride: assignment.deadlineOverride,
            startsAtOverride: assignment.startsAtOverride,
          },
        });
      }

      if (shouldSyncCandidateRoster) {
        await syncQuizCandidates(tx, id, roster.candidates);
      } else if (!candidateSettings.enabled) {
        await tx.quizCandidate.updateMany({
          where: { quizId: id, isRevoked: false },
          data: { isRevoked: true, revokedAt: new Date() },
        });
      }

      // 2. Re-create questions
      await tx.question.deleteMany({
        where: { quizId: id }
      });

      for (const q of questions) {
        await tx.question.create({
          data: {
            quizId: id,
            text: q.questionText,
            type: q.type || "MULTIPLE_CHOICE",
            options: q.options,
            correctAnswer: q.correctAnswer,
            score: q.score ?? 1.0,
            explanation: q.explanation || null,
            imageUrl: q.imageUrl || null,
          },
        });
      }
    });

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    revalidatePath("/student/quizzes");
    revalidatePath("/quizzes");
    return { success: true };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi cập nhật đề kiểm tra." };
  }
}

export async function getQuizCandidates(quizId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Vui lòng đăng nhập để quản lý mã dự thi." };
    const manager = await assertQuizManager(session, quizId);
    if (manager.error) return { success: false, error: manager.error };

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        isPublic: true,
        candidateAccessRequired: true,
        candidateMaxSubmissions: true,
        assignments: { select: { classId: true, class: { select: { name: true } } }, orderBy: { class: { name: "asc" } } },
      },
    });
    if (!quiz?.candidateAccessRequired || quiz.isPublic) return { success: false, error: "Đề thi này không sử dụng mã dự thi nội bộ." };

    const candidates = await db.quizCandidate.findMany({
      where: { quizId },
      orderBy: [{ isRevoked: "asc" }, { name: "asc" }],
      select: {
        id: true, classId: true, name: true, source: true, codeCiphertext: true, isRevoked: true,
        revokedAt: true, submittedCount: true, maxSubmissionsOverride: true, bindingExpiresAt: true,
      },
    });
    const data = candidates.map((candidate) => {
      const effectiveMaxSubmissions = getEffectiveCandidateMaxSubmissions(candidate, quiz.candidateMaxSubmissions);
      return {
        id: candidate.id,
        classId: candidate.classId,
        name: candidate.name,
        source: candidate.source,
        code: decryptCandidateCode(candidate.codeCiphertext),
        isRevoked: candidate.isRevoked,
        revokedAt: candidate.revokedAt?.toISOString() ?? null,
        submittedCount: candidate.submittedCount,
        maxSubmissionsOverride: candidate.maxSubmissionsOverride,
        effectiveMaxSubmissions,
        bindingExpiresAt: candidate.bindingExpiresAt?.toISOString() ?? null,
      };
    });
    return {
      success: true,
      data,
      quiz: {
        title: quiz.title,
        maxSubmissions: quiz.candidateMaxSubmissions,
        classes: quiz.assignments.map((assignment) => ({
          classId: assignment.classId,
          className: assignment.class.name,
        })),
      },
    };
  } catch (error) {
    console.error("Error loading quiz candidates:", error);
    return { success: false, error: "Không thể tải danh sách mã dự thi." };
  }
}

export async function setQuizCandidateRevocation(quizId: string, candidateId: string, isRevoked: boolean) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Vui lòng đăng nhập để quản lý mã dự thi." };
    const manager = await assertQuizManager(session, quizId);
    if (manager.error) return { success: false, error: manager.error };

    const result = await db.quizCandidate.updateMany({
      where: { id: candidateId, quizId },
      data: isRevoked
        ? { isRevoked: true, revokedAt: new Date(), bindingSecretDigest: null, bindingStartedAt: null, bindingExpiresAt: null }
        : { isRevoked: false, revokedAt: null },
    });
    if (result.count !== 1) return { success: false, error: "Không tìm thấy thí sinh." };

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    return { success: true };
  } catch (error) {
    console.error("Error updating quiz candidate revocation:", error);
    return { success: false, error: "Không thể cập nhật trạng thái mã dự thi." };
  }
}

export async function resetQuizCandidateSubmissions(quizId: string, candidateId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Vui lòng đăng nhập để quản lý mã dự thi." };
    const manager = await assertQuizManager(session, quizId);
    if (manager.error) return { success: false, error: manager.error };

    const result = await db.quizCandidate.updateMany({
      where: { id: candidateId, quizId },
      data: { submittedCount: 0 },
    });
    if (result.count !== 1) return { success: false, error: "Không tìm thấy thí sinh." };

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    return { success: true, data: { submittedCount: 0 } };
  } catch (error) {
    console.error("Error resetting quiz candidate submissions:", error);
    return { success: false, error: "Không thể đặt lại lượt nộp của mã dự thi." };
  }
}

export async function setQuizCandidateMaxSubmissions(
  quizId: string,
  candidateId: string,
  maxSubmissionsOverride: number | null,
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Vui lòng đăng nhập để quản lý mã dự thi." };
    const manager = await assertQuizManager(session, quizId);
    if (manager.error) return { success: false, error: manager.error };

    const normalized = normalizeCandidateMaxSubmissionsOverride(maxSubmissionsOverride);
    if (normalized.error) return { success: false, error: normalized.error };

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { candidateMaxSubmissions: true },
    });
    if (!quiz) return { success: false, error: "Đề kiểm tra không tồn tại." };

    const candidate = await db.quizCandidate.updateMany({
      where: { id: candidateId, quizId },
      data: { maxSubmissionsOverride: normalized.value },
    });
    if (candidate.count !== 1) return { success: false, error: "Không tìm thấy thí sinh." };

    const updated = await db.quizCandidate.findFirst({
      where: { id: candidateId, quizId },
      select: { submittedCount: true, maxSubmissionsOverride: true },
    });
    if (!updated) return { success: false, error: "Không tìm thấy thí sinh." };

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    return {
      success: true,
      data: {
        submittedCount: updated.submittedCount,
        maxSubmissionsOverride: updated.maxSubmissionsOverride,
        effectiveMaxSubmissions: getEffectiveCandidateMaxSubmissions(updated, quiz.candidateMaxSubmissions),
      },
    };
  } catch (error) {
    console.error("Error updating quiz candidate submission limit:", error);
    return { success: false, error: "Không thể cập nhật giới hạn lượt nộp của mã dự thi." };
  }
}

export async function resetQuizCandidateBinding(quizId: string, candidateId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Vui lòng đăng nhập để quản lý mã dự thi." };
    const manager = await assertQuizManager(session, quizId);
    if (manager.error) return { success: false, error: manager.error };
    const result = await db.quizCandidate.updateMany({
      where: { id: candidateId, quizId },
      data: { bindingSecretDigest: null, bindingStartedAt: null, bindingExpiresAt: null },
    });
    if (result.count !== 1) return { success: false, error: "Không tìm thấy thí sinh." };
    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    return { success: true };
  } catch (error) {
    console.error("Error resetting quiz candidate binding:", error);
    return { success: false, error: "Không thể gỡ khóa trình duyệt." };
  }
}

export async function getQuizSubmissions(quizId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Bạn không có quyền xem kết quả bài kiểm tra này." };
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            _count: { select: { students: true } },
          },
        },
        assignments: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                _count: { select: { students: true } },
              },
            },
          },
        },
      },
    });

    if (!quiz) return { success: false, error: "Đề kiểm tra không tồn tại." };

    // TEACHER: chỉ xem submissions của quiz mình tạo
    if (session.role === "TEACHER") {
      const teacher = await db.teacherProfile.findUnique({ where: { userId: session.userId } });
      if (!teacher || quiz.teacherId !== teacher.id) {
        return { success: false, error: "Bạn không có quyền xem kết quả đề kiểm tra này." };
      }
    }

    const submissions = await db.quizSubmission.findMany({
      where: { quizId },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            classes: { select: { id: true, name: true } },
          },
        },
        candidate: { select: { name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const formatted = submissions.map((s) => {
      const classGroups = s.class
        ? [{ id: s.class.id, name: s.class.name }]
        : s.student
        ? s.student.classes.map((c) => ({ id: c.id, name: c.name }))
        : [];
      const candidateClassIds = classGroups.map((c) => c.id);
      const candidateClassName = classGroups.length > 0 ? classGroups.map((c) => c.name).join(", ") : "Tự do (Thi thử)";

      return {
        id: s.id,
        candidateName: s.candidate?.name ?? (s.student ? s.student.user.name : (s.guestName || "Thí sinh tự do")),
        classId: s.classId ?? null,
        classIds: candidateClassIds,
        classGroups,
        classes: candidateClassName,
        score: s.score,
        submittedAt: s.submittedAt.toISOString(),
      };
    });

    const assignmentTabs = quiz.assignments.length > 0
      ? quiz.assignments.map((a) => ({
          classId: a.classId,
          className: a.class.name,
          studentCount: a.class._count.students,
          deadlineOverride: a.deadlineOverride ? a.deadlineOverride.toISOString() : null,
          startsAtOverride: a.startsAtOverride ? a.startsAtOverride.toISOString() : null,
        }))
      : quiz.class
      ? [{
          classId: quiz.class.id,
          className: quiz.class.name,
          studentCount: quiz.class._count.students,
          deadlineOverride: null,
          startsAtOverride: null,
        }]
      : [];

    const quizInfo = {
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passingScore,
      deadline: quiz.deadline ? quiz.deadline.toISOString() : null,
      assignments: assignmentTabs,
    };

    return { success: true, data: formatted, quizInfo };
  } catch (error) {
    console.error("Error loading quiz submissions:", error);
    return { success: false, error: "Lỗi hệ thống khi tải kết quả làm bài." };
  }
}

export async function getAllQuizzesForHomework() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Bạn không có quyền xem danh sách đề thi." };
    }

    const quizzes = await db.quiz.findMany({
      select: {
        id: true,
        title: true,
        subjectId: true,
        classId: true
      },
      orderBy: { title: "asc" }
    });

    return { success: true, data: quizzes };
  } catch (error) {
    console.error("Error fetching quizzes for homework:", error);
    return { success: false, error: "Lỗi tải đề thi." };
  }
}

export async function getStudentQuizResult(quizId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return { success: false, error: "Chưa đăng nhập học sinh." };
    }
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId }
    });
    if (!studentProfile) {
      return { success: false, error: "Hồ sơ học sinh không tồn tại." };
    }
    const submission = await db.quizSubmission.findFirst({
      where: {
        quizId,
        studentId: studentProfile.id
      },
      orderBy: { submittedAt: "desc" }
    });
    if (submission) {
      return { success: true, data: { score: submission.score } };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Lỗi hệ thống khi tải kết quả BTVN." };
  }
}

export async function getSystemStats() {
  try {
    const totalQuizzes = await db.quiz.count();
    const totalStudents = await db.studentProfile.count();
    const totalSubmissions = await db.quizSubmission.count() + await db.homeworkSubmission.count();
    const totalCourses = await db.course.count();

    return {
      success: true,
      data: {
        totalQuizzes,
        totalStudents,
        totalSubmissions,
        totalCourses,
      }
    };
  } catch (error) {
    console.error("Error getting system stats:", error);
    return { success: false, error: "Không thể lấy thông số hệ thống." };
  }
}
