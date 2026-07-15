import React from "react";
import { db } from "@/lib/db";
import PublicQuizzesClient from "./PublicQuizzesClient";

export const dynamic = "force-dynamic";

export default async function PublicQuizzesPage() {
  const quizzes = await db.quiz.findMany({
    where: { isPublic: true },
    include: {
      subject: true,
      questions: true,
    },
    orderBy: { id: "desc" },
  });

  // Map to the simple format that Client Component can consume
  const formattedQuizzes = quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description || "",
    duration: q.duration,
    passingScore: q.passingScore,
    category: q.subject.name,
    answerVisibility: q.answerVisibility,
    questions: q.questions.map((qn) => ({
      id: qn.id,
      text: qn.text,
      type: qn.type,
      options: qn.options as string[],
      score: qn.score,
    })),
  }));

  return <PublicQuizzesClient initialQuizzes={formattedQuizzes} />;
}
