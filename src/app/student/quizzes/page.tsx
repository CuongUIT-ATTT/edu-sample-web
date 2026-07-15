import React from "react";
import { db } from "@/lib/db";
import QuizClient from "./QuizClient";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentQuizzesPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  let quizzes: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    passingScore: number;
    questions: { id: string; text: string; type?: string; options: string[]; score: number }[];
  }[] = [];

  try {
    const dbQuizzes = await db.quiz.findMany({
      where: {
        OR: [
          { classId: null },
          { classId: studentProfile.classId }
        ]
      },
      include: {
        questions: true,
      },
    });

    quizzes = dbQuizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      duration: quiz.duration,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options as string[],
        score: q.score,
      })),
    }));
  } catch (error) {
    console.error("Error loading quizzes:", error);
  }

  return <QuizClient quizzes={quizzes} />;
}
