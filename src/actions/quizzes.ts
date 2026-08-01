"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface SubmitQuizInput {
  quizId: string;
  answers: Record<string, string>; // Map of question ID to answer index string
  guestName?: string;
  timeExpired?: boolean;
}

/**
 * Quyết định có hiển thị đáp án sau khi nộp hay không.
 * - IMMEDIATELY: luôn hiển thị
 * - WHEN_ENDED: chỉ khi hết thời gian (timer = 0)
 * - NEVER: không hiển thị
 * - AFTER_ALL_SUBMITTED: đề private gắn lớp — hiển thị khi tất cả học sinh lớp đã nộp
 *   HOẶC đã qua deadline. Nếu không có lớp → hành xử như IMMEDIATELY.
 */
async function resolveAnswerVisibility(
  quiz: { id: string; answerVisibility: string; classId: string | null; deadline: Date | null },
  timeExpired: boolean,
  now: Date = new Date(),
): Promise<boolean> {
  switch (quiz.answerVisibility) {
    case "IMMEDIATELY":
      return true;
    case "WHEN_ENDED":
      return !!timeExpired;
    case "NEVER":
      return false;
    case "AFTER_ALL_SUBMITTED": {
      // Đề không gắn lớp → không có nhóm để chờ → như IMMEDIATELY
      if (!quiz.classId) return true;
      // Đã qua deadline (nếu có đặt) → mở đáp án
      if (quiz.deadline && now > new Date(quiz.deadline)) return true;
      const classInfo = await db.class.findUnique({
        where: { id: quiz.classId },
        select: { _count: { select: { students: true } } },
      });
      const studentCount = classInfo?._count.students ?? 0;
      if (studentCount === 0) return false; // lớp trống → không vội lộ đáp án
      const submitted = await db.quizSubmission.findMany({
        where: { quizId: quiz.id, studentId: { not: null } },
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
      include: { questions: true },
    });

    if (!quiz) {
      return { success: false, error: "Đề kiểm tra trắc nghiệm không tồn tại." };
    }

    let studentProfile = null;
    if (session && session.role === "STUDENT") {
      studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
      });
    }

    // Access control: if not student and not public, reject
    if (!studentProfile && !quiz.isPublic) {
      return { success: false, error: "Đề thi này không công khai. Chỉ học sinh đã đăng nhập mới có quyền làm bài." };
    }

    // Guest name validation for public quizzes
    if (!studentProfile && quiz.isPublic && !input.guestName?.trim()) {
      return { success: false, error: "Vui lòng nhập Họ tên để bắt đầu làm bài thi thử công khai." };
    }

    let totalScore = 0;
    let maxScore = 0;

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

    // Check if submitted after deadline — flag as late, still accept (không chặn)
    const isLate = quiz.deadline ? new Date() > new Date(quiz.deadline) : false;

    const submission = await db.quizSubmission.create({
      data: {
        studentId: studentProfile ? studentProfile.id : null,
        quizId: quiz.id,
        score: totalScore,
        answers: JSON.parse(JSON.stringify(input.answers)),
        guestName: studentProfile ? null : input.guestName?.trim(),
        isLate,
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

    const showAnswers = await resolveAnswerVisibility(quiz, !!input.timeExpired);

    return {
      success: true,
      data: {
        score: totalScore,
        maxScore,
        passed,
        submissionId: submission.id,
        isLate,
        correctAnswers: showAnswers ? quiz.questions.map((q: { id: string; correctAnswer: string; explanation: string | null }) => ({
          id: q.id,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        })) : null
      }
    };
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi chấm bài thi trắc nghiệm." };
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
  isPublic?: boolean;
  answerVisibility?: string; // IMMEDIATELY, WHEN_ENDED, NEVER, AFTER_ALL_SUBMITTED
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
      });
      if (!teacher) {
        return { success: false, error: "Hồ sơ giảng viên của bạn không tồn tại." };
      }
      teacherId = teacher.id;
    }

    const { title, description, duration, passingScore, deadline, subjectId, classId, isPublic, answerVisibility, questions } = input;

    if (!title || isNaN(duration) || isNaN(passingScore) || !subjectId || questions.length === 0) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin đề thi và ít nhất 1 câu hỏi." };
    }

    // AFTER_ALL_SUBMITTED chỉ hợp lệ cho đề private CÓ gắn lớp; ngược lại ép về IMMEDIATELY
    const finalVisibility =
      answerVisibility === "AFTER_ALL_SUBMITTED" && (isPublic || !classId)
        ? "IMMEDIATELY"
        : answerVisibility || "IMMEDIATELY";

    const quiz = await db.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          description: description || null,
          duration,
          passingScore,
          deadline: deadline ? new Date(deadline) : null,
          subjectId,
          classId: classId || null,
          isPublic: isPublic || false,
          answerVisibility: finalVisibility,
          teacherId,
        },
      });

      for (const q of questions) {
        await tx.question.create({
          data: {
            quizId: newQuiz.id,
            text: q.questionText,
            type: q.type || "MULTIPLE_CHOICE",
            options: q.options,
            correctAnswer: q.correctAnswer,
            score: q.score || 1.0,
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

    const { id, title, description, duration, passingScore, deadline, subjectId, classId, isPublic, answerVisibility, questions } = input;

    // AFTER_ALL_SUBMITTED chỉ hợp lệ cho đề private CÓ gắn lớp
    const finalVisibility =
      answerVisibility === "AFTER_ALL_SUBMITTED" && (isPublic || !classId)
        ? "IMMEDIATELY"
        : answerVisibility || "IMMEDIATELY";

    await db.$transaction(async (tx) => {
      // 1. Update quiz basic info
      await tx.quiz.update({
        where: { id },
        data: {
          title,
          description: description || null,
          duration,
          passingScore,
          deadline: deadline ? new Date(deadline) : null,
          subjectId,
          classId: classId || null,
          isPublic: isPublic || false,
          answerVisibility: finalVisibility,
        },
      });

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
            score: q.score || 1.0,
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

    const submissions = await db.quizSubmission.findMany({
      where: { quizId },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            classes: { select: { name: true } }
          }
        }
      },
      orderBy: { submittedAt: "desc" }
    });

    const formatted = submissions.map(s => ({
      id: s.id,
      candidateName: s.student ? s.student.user.name : (s.guestName || "Thí sinh tự do"),
      classes: s.student ? s.student.classes.map(c => c.name).join(", ") : "Tự do (Thi thử)",
      score: s.score,
      submittedAt: s.submittedAt.toISOString()
    }));

    return { success: true, data: formatted };
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
