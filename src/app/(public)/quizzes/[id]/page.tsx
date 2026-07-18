/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import SingleQuizPlayer from "./SingleQuizPlayer";

export const dynamic = "force-dynamic";

export default async function SharedQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: true,
    },
  });

  if (!quiz) {
    notFound();
  }

  // Auth/Authorization check for private quizzes
  if (!quiz.isPublic) {
    if (!session) {
      redirect(`/login?callbackUrl=/quizzes/${id}`);
    }

    if (session.role === "STUDENT") {
      // Check if student belongs to the class that is assigned to the quiz
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: session.userId },
        include: { classes: true },
      });

      if (!studentProfile) {
        return (
          <div className="bg-canvas border border-hairline rounded-lg p-16 text-center max-w-xl mx-auto shadow-sm mt-10">
            <p className="font-body text-red-600 font-semibold">Tài khoản của bạn chưa được liên kết hồ sơ Học sinh.</p>
          </div>
        );
      }

      if (quiz.classId) {
        const isEnrolled = studentProfile.classes.some((c) => c.id === quiz.classId);
        if (!isEnrolled) {
          return (
            <div className="bg-canvas border border-hairline rounded-lg p-16 text-center max-w-xl mx-auto shadow-sm mt-10">
              <p className="font-body text-red-600 font-semibold">Bài thi này dành riêng cho một lớp học cụ thể mà bạn không tham gia.</p>
            </div>
          );
        }
      }
    }
  }

  // Format questions to match Client expectations
  const formattedQuestions = quiz.questions.map((q) => ({
    id: q.id,
    questionText: q.text,
    type: q.type,
    options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
    score: q.score,
    correctAnswer: q.correctAnswer,
    imageUrl: q.imageUrl ?? null,
  }));

  const formattedQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: (quiz.description || "").replace("[UNLISTED]", "").trim(),
    duration: quiz.duration,
    passingScore: quiz.passingScore,
    subjectName: quiz.subject.name,
    isPublic: quiz.isPublic,
    answerVisibility: quiz.answerVisibility,
    questions: formattedQuestions,
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <SingleQuizPlayer quiz={formattedQuiz as any} sessionUser={session ? { name: session.name, role: session.role } : null} skipRules={true} />
    </div>
  );
}
