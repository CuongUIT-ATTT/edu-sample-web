import React from "react";
import { db } from "@/lib/db";
import QuizClient from "./QuizClient";

export const dynamic = "force-dynamic";

export default async function StudentQuizzesPage() {
  let quizzes: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    passingScore: number;
    questions: { id: string; text: string; options: string[]; score: number }[];
  }[] = [];

  try {
    const dbQuizzes = await db.quiz.findMany({
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
        options: q.options as string[],
        score: q.score,
      })),
    }));
  } catch (error) {
    console.error("Error loading quizzes:", error);
  }

  return <QuizClient quizzes={quizzes} />;
}
