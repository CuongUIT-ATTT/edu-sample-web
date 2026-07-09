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
    // 1. Authenticate and get session
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

    // 2. Fetch quiz and questions
    const quiz = await db.quiz.findUnique({
      where: { id: input.quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return { success: false, error: "Đề kiểm tra trắc nghiệm không tồn tại." };
    }

    // 3. Score calculation
    let totalScore = 0;
    let maxScore = 0;

    for (const question of quiz.questions) {
      maxScore += question.score;
      const studentAnswer = input.answers[question.id];
      if (studentAnswer === question.correctAnswer) {
        totalScore += question.score;
      }
    }

    // 4. Save QuizSubmission
    const submission = await db.quizSubmission.create({
      data: {
        studentId: studentProfile.id,
        quizId: quiz.id,
        score: totalScore,
        answers: JSON.parse(JSON.stringify(input.answers)),
      },
    });

    // 5. Automatically record in Grade table for student GPA mapping
    await db.grade.create({
      data: {
        studentId: studentProfile.id,
        subjectId: quiz.subjectId,
        teacherId: quiz.teacherId,
        type: "QUIZ",
        score: totalScore,
        weight: 0.1, // standard weight for quick quiz
        remarks: `Điểm thi trắc nghiệm trực tuyến: ${quiz.title}`,
      },
    });

    // 6. Clear paths
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
