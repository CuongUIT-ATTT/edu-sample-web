"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface SubmitQuizInput {
  quizId: string;
  answers: Record<string, string>; // Map of question ID to answer index string
}

export async function submitQuiz(input: SubmitQuizInput) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return { success: false, error: "Chỉ học sinh mới có quyền làm bài kiểm tra trắc nghiệm." };
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!studentProfile) {
      return { success: false, error: "Không tìm thấy hồ sơ học sinh tương ứng." };
    }

    const quiz = await db.quiz.findUnique({
      where: { id: input.quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return { success: false, error: "Đề kiểm tra trắc nghiệm không tồn tại." };
    }

    let totalScore = 0;
    let maxScore = 0;

    for (const question of quiz.questions) {
      maxScore += question.score;
      const studentAnswer = input.answers[question.id];
      if (studentAnswer === question.correctAnswer) {
        totalScore += question.score;
      }
    }

    const submission = await db.quizSubmission.create({
      data: {
        studentId: studentProfile.id,
        quizId: quiz.id,
        score: totalScore,
        answers: JSON.parse(JSON.stringify(input.answers)),
      },
    });

    await db.grade.create({
      data: {
        studentId: studentProfile.id,
        subjectId: quiz.subjectId,
        teacherId: quiz.teacherId,
        type: "QUIZ",
        score: totalScore,
        weight: 0.1,
        remarks: `Điểm thi trắc nghiệm trực tuyến: ${quiz.title}`,
      },
    });

    revalidatePath("/student/grades");
    revalidatePath("/student");
    revalidatePath("/parent");

    const passed = totalScore >= quiz.passingScore;

    return { 
      success: true, 
      data: {
        score: totalScore,
        maxScore,
        passed,
        submissionId: submission.id
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
  subjectId: string;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: string;
    score?: number;
  }[];
}

export async function createQuiz(input: CreateQuizInput) {
  try {
    const session = await getSession();
    if (!session || session.role !== "TEACHER") {
      return { success: false, error: "Chỉ giảng viên mới được tạo đề kiểm tra." };
    }

    const teacher = await db.teacherProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!teacher) {
      return { success: false, error: "Hồ sơ giảng viên của bạn không tồn tại." };
    }

    const { title, description, duration, passingScore, subjectId, questions } = input;

    if (!title || isNaN(duration) || isNaN(passingScore) || !subjectId || questions.length === 0) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin đề thi và ít nhất 1 câu hỏi." };
    }

    const quiz = await db.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          description: description || null,
          duration,
          passingScore,
          subjectId,
          teacherId: teacher.id,
        },
      });

      for (const q of questions) {
        await tx.question.create({
          data: {
            quizId: newQuiz.id,
            text: q.questionText,
            type: "MULTIPLE_CHOICE",
            options: q.options,
            correctAnswer: q.correctAnswer,
            score: q.score || 1.0,
          },
        });
      }

      return newQuiz;
    });

    revalidatePath("/teacher/quizzes");
    revalidatePath("/student/quizzes");
    return { success: true, data: quiz };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi tạo đề kiểm tra." };
  }
}

export async function deleteQuiz(quizId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "TEACHER") {
      return { success: false, error: "Chỉ giảng viên mới được xoá đề kiểm tra." };
    }

    await db.quiz.delete({
      where: { id: quizId },
    });

    revalidatePath("/teacher/quizzes");
    revalidatePath("/student/quizzes");
    return { success: true, message: "Xoá đề kiểm tra thành công." };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi xoá đề kiểm tra." };
  }
}
