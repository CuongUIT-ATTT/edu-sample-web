"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { teacherClassIds } from "@/lib/teacher-classes";
import { generateExamCode, generatePaper, gradeWithLayout, isOverdue } from "@/lib/quiz-shuffle";

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
  assignments?: QuizAssignment[];
};

type ResolvedQuizAccess = {
  allowed: boolean;
  error?: string;
  assignment: QuizAssignment | null;
  classId: string | null;
};

interface SubmitQuizInput {
  quizId: string;
  answers: Record<string, string>; // Map of question ID to answer index string
  guestName?: string;
  timeExpired?: boolean;
  attemptId?: string; // mã đề (QuizAttempt) — chấm theo layout khi có
  classId?: string;
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

/**
 * Quyết định có hiển thị đáp án sau khi nộp hay không.
 * - IMMEDIATELY: luôn hiển thị
 * - WHEN_ENDED: chỉ khi hết thời gian (timer = 0)
 * - NEVER: không hiển thị
 * - AFTER_ALL_SUBMITTED: đề private gắn lớp — hiển thị khi tất cả học sinh trong lớp hiệu lực đã nộp
 *   HOẶC đã qua deadline hiệu lực. Nếu không có lớp → hành xử như IMMEDIATELY.
 */
async function resolveAnswerVisibility(
  quiz: { id: string; answerVisibility: string },
  context: { classId: string | null; deadline: Date | null; timeExpired: boolean },
  now: Date = new Date(),
): Promise<boolean> {
  switch (quiz.answerVisibility) {
    case "IMMEDIATELY":
      return true;
    case "WHEN_ENDED":
      return context.timeExpired;
    case "NEVER":
      return false;
    case "AFTER_ALL_SUBMITTED": {
      if (!context.classId) return true;
      if (context.deadline && now > context.deadline) return true;

      const classInfo = await db.class.findUnique({
        where: { id: context.classId },
        select: { _count: { select: { students: true } } },
      });
      const studentCount = classInfo?._count.students ?? 0;
      if (studentCount === 0) return false;

      const submitted = await db.quizSubmission.findMany({
        where: {
          quizId: quiz.id,
          studentId: { not: null },
          student: { classes: { some: { id: context.classId } } },
        },
        select: { studentId: true },
        distinct: ["studentId"],
      });
      return submitted.length >= studentCount;
    }
    default:
      return false;
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
    const access = resolveQuizAssignmentForStudent(quiz, studentProfile);
    if (!access.allowed) {
      return { success: false, error: access.error ?? "Bạn không có quyền làm bài thi này." };
    }

    // Guest name validation for public quizzes
    // Guest (chưa đăng nhập) bắt buộc nhập họ tên. User đã đăng nhập (kể cả
    // không phải STUDENT) luôn có định danh session → không cần guestName.
    if (!session && !studentProfile && quiz.isPublic && !input.guestName?.trim()) {
      return { success: false, error: "Vui lòng nhập Họ tên để bắt đầu làm bài thi thử công khai." };
    }

    // ── Chấm điểm ──────────────────────────────────────────────────────────
    let totalScore = 0;
    let maxScore = 0;
    let correctAnswersData: { id: string; correctAnswer: string; explanation: string | null }[] | null = null;
    let isTimedOut = false;
    let attempt = null;

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
      if (attempt.studentId !== (studentProfile ? studentProfile.id : null)) {
        return { success: false, error: "Mã đề này không thuộc về bạn." };
      }

      const layout = attempt.layout as { questionOrder: Record<string, string[]>; optionOrder: Record<string, number[]> };
      const questionsById: Record<string, { id: string; type: string; correctAnswer: string; score: number; explanation: string | null }> = {};
      for (const q of attempt.quiz.questions) {
        questionsById[q.id] = { id: q.id, type: q.type, correctAnswer: q.correctAnswer, score: q.score, explanation: q.explanation };
      }

      const graded = gradeWithLayout(questionsById, layout, input.answers);
      totalScore = graded.totalScore;
      maxScore = graded.maxScore;
      correctAnswersData = graded.correctAnswers;

      isTimedOut = isOverdue(attempt.endsAt);
      // Cập nhật attempt: SUBMITTED trong giờ, TIMED_OUT nếu quá giờ (tự thu bài)
      await db.quizAttempt.update({
        where: { id: attempt.id },
        data: { status: isTimedOut ? "TIMED_OUT" : "SUBMITTED", submittedAt: new Date() },
      });
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
    const targetClassId = input.classId?.trim() || attempt?.classId || access.classId || null;
    const targetAssignment = targetClassId
      ? quiz.assignments.find((a) => a.classId === targetClassId) ?? access.assignment
      : access.assignment;
    const effectiveDeadline = getEffectiveDeadline(quiz, targetAssignment);
    const isLate = (effectiveDeadline ? new Date() > effectiveDeadline : false) || isTimedOut;

    const submission = await db.quizSubmission.create({
      data: {
        studentId: studentProfile ? studentProfile.id : null,
        quizId: quiz.id,
        score: totalScore,
        answers: JSON.parse(JSON.stringify(input.answers)),
        guestName: studentProfile ? null : input.guestName?.trim(),
        isLate,
        attemptId: attempt ? attempt.id : null,
        classId: targetClassId,
      },
    });

    // Only record grades for logged-in students
    if (studentProfile) {
      // Find fallback teacher if quiz has no teacherId (created by Admin)
      let finalTeacherId = quiz.teacherId;
      if (!finalTeacherId) {
        const fallbackTeacher = await db.teacherProfile.findFirst();
        finalTeacherId = fallbackTeacher ? fallbackTeacher.id : null;
      }

      await db.grade.create({
        data: {
          studentId: studentProfile.id,
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

    const showAnswers = await resolveAnswerVisibility(quiz, {
      classId: targetClassId,
      deadline: effectiveDeadline,
      timeExpired: !!input.timeExpired,
    });

    const finalCorrectAnswers = showAnswers
      ? (correctAnswersData ?? quiz.questions.map((q: { id: string; correctAnswer: string; explanation: string | null }) => ({
          id: q.id,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        })))
      : null;

    return {
      success: true,
      data: {
        score: totalScore,
        maxScore,
        passed,
        submissionId: submission.id,
        isLate,
        correctAnswers: finalCorrectAnswers
      }
    };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi chấm bài thi trắc nghiệm." };
  }
}

interface StartQuizAttemptInput {
  quizId: string;
  guestName?: string;
  classId?: string;
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
    const access = resolveQuizAssignmentForStudent(quiz, studentProfile);
    if (!access.allowed) {
      return { success: false, error: access.error ?? "Bạn không có quyền làm bài thi này." };
    }

    // Guest (chưa đăng nhập) bắt buộc nhập họ tên. User đã đăng nhập (kể cả
    // không phải STUDENT) luôn có định danh session → không cần guestName.
    if (!session && !studentProfile && quiz.isPublic && !input.guestName?.trim()) {
      return { success: false, error: "Vui lòng nhập Họ tên để bắt đầu làm bài thi thử công khai." };
    }

    const targetClassId = input.classId?.trim() || access.classId || null;
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
        studentId: studentProfile ? studentProfile.id : null,
        guestName: studentProfile ? null : input.guestName?.trim(),
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

interface CreateQuizInput {
  title: string;
  description?: string;
  duration: number;
  passingScore: number;
  deadline?: string | null; // ISO string, null = không đóng đề
  subjectId: string;
  classId?: string;
  assignments?: QuizAssignmentInput[];
  isPublic?: boolean;
  answerVisibility?: string; // IMMEDIATELY, WHEN_ENDED, NEVER, AFTER_ALL_SUBMITTED
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

    const classIds = normalizedAssignments.assignments.map((assignment) => assignment.classId);
    const assignmentError = await assertTeacherCanAssignClasses(session, classIds);
    if (assignmentError) return { success: false, error: assignmentError };

    // AFTER_ALL_SUBMITTED chỉ hợp lệ cho đề private CÓ ít nhất một lớp; ngược lại ép về IMMEDIATELY
    const finalVisibility =
      answerVisibility === "AFTER_ALL_SUBMITTED" && (isPublic || classIds.length === 0)
        ? "IMMEDIATELY"
        : answerVisibility || "IMMEDIATELY";

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

    const classIds = normalizedAssignments.assignments.map((assignment) => assignment.classId);

    // TEACHER: chỉ sửa quiz mình tạo + class ownership
    if (session.role === "TEACHER") {
      const teacher = await db.teacherProfile.findUnique({
        where: { userId: session.userId },
        include: { subjects: true },
      });
      const existingQuiz = await db.quiz.findUnique({ where: { id } });
      if (!existingQuiz) return { success: false, error: "Đề kiểm tra không tồn tại." };
      if (!teacher || existingQuiz.teacherId !== teacher.id) {
        return { success: false, error: "Bạn không có quyền sửa đề kiểm tra này." };
      }
    }

    const assignmentError = await assertTeacherCanAssignClasses(session, classIds);
    if (assignmentError) return { success: false, error: assignmentError };

    // AFTER_ALL_SUBMITTED chỉ hợp lệ cho đề private CÓ ít nhất một lớp
    const finalVisibility =
      answerVisibility === "AFTER_ALL_SUBMITTED" && (isPublic || classIds.length === 0)
        ? "IMMEDIATELY"
        : answerVisibility || "IMMEDIATELY";

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

export async function getQuizSubmissions(quizId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return { success: false, error: "Bạn không có quyền xem kết quả bài kiểm tra này." };
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
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
        class: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const formatted = submissions.map((s) => {
      const candidateClassIds = s.classId ? [s.classId] : (s.student ? s.student.classes.map((c) => c.id) : []);
      const candidateClassName = s.class?.name || (s.student && s.student.classes.length > 0 ? s.student.classes.map((c) => c.name).join(", ") : "Tự do (Thi thử)");

      return {
        id: s.id,
        candidateName: s.student ? s.student.user.name : (s.guestName || "Thí sinh tự do"),
        classId: s.classId ?? null,
        classIds: candidateClassIds,
        classes: candidateClassName,
        score: s.score,
        submittedAt: s.submittedAt.toISOString(),
      };
    });

    const quizInfo = {
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passingScore,
      deadline: quiz.deadline ? quiz.deadline.toISOString() : null,
      assignments: quiz.assignments.map((a) => ({
        classId: a.classId,
        className: a.class.name,
        studentCount: a.class._count.students,
        deadlineOverride: a.deadlineOverride ? a.deadlineOverride.toISOString() : null,
        startsAtOverride: a.startsAtOverride ? a.startsAtOverride.toISOString() : null,
      })),
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
    if (!session) {
      return { success: false, error: "Bạn chưa đăng nhập." };
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
