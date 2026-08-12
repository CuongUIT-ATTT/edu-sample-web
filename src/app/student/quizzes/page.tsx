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
    include: { classes: true },
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
    deadline: string | null;
    questions: { id: string; text: string; type?: string; options?: string[]; score: number; imageUrl?: string | null }[];
  }[] = [];

  try {
    const classIds = studentProfile.classes.map((c) => c.id);
    const dbQuizzes = await db.quiz.findMany({
      where: {
        OR: [
          { classId: null },
          { classId: { in: classIds } }
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
      deadline: quiz.deadline?.toISOString() ?? null,
      answerVisibility: quiz.answerVisibility,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        score: q.score,
        imageUrl: q.imageUrl ?? null,
      })),
    }));
  } catch (error) {
    console.error("Error loading quizzes:", error);
  }

  return <QuizClient quizzes={quizzes} />;
}
