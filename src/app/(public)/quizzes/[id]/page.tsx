/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import SingleQuizPlayer from "./SingleQuizPlayer";

export const dynamic = "force-dynamic";

export default async function SharedQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ classId?: string }>;
}) {
  const { id } = await params;
  const { classId } = await searchParams;
  const session = await getSession();

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: true,
      assignments: {
        include: {
          class: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  let effectiveAssignment: (typeof quiz.assignments)[number] | null = null;
  let assignedClassName: string | null = null;

  if (classId) {
    const matchedAssignment = quiz.assignments.find((a) => a.classId === classId);
    if (matchedAssignment) {
      effectiveAssignment = matchedAssignment;
      assignedClassName = matchedAssignment.class.name;
    } else {
      const cls = await db.class.findUnique({
        where: { id: classId },
        select: { name: true },
      });
      if (cls) assignedClassName = cls.name;
    }
  }

  // Server actions enforce every access decision. The page remains available
  // to anonymous or mismatched sessions so a rostered student can use their
  // issued candidate code instead of an account.
  if (!quiz.isPublic && session?.role === "STUDENT") {
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
      include: { classes: true },
    });
    const studentClassIds = studentProfile?.classes.map((item) => item.id) ?? [];
    if (!effectiveAssignment) {
      effectiveAssignment = quiz.assignments
        .filter((assignment) => studentClassIds.includes(assignment.classId))
        .sort((a, b) => a.classId.localeCompare(b.classId))[0] ?? null;
      if (effectiveAssignment) assignedClassName = effectiveAssignment.class.name;
    }
  }

  // Format questions to match Client expectations (không gửi options/correctAnswer
  // vào payload ban đầu — client sẽ gọi startQuizAttempt để lấy đề xáo trộn)
  const formattedQuestions = quiz.questions.map((q) => ({
    id: q.id,
    questionText: q.text,
    type: q.type,
    score: q.score,
    imageUrl: q.imageUrl ?? null,
  }));

  const formattedQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: (quiz.description || "").replace("[UNLISTED]", "").trim(),
    duration: quiz.duration,
    passingScore: quiz.passingScore,
    deadline: (effectiveAssignment?.deadlineOverride ?? quiz.deadline)?.toISOString() ?? null,
    startsAt: effectiveAssignment?.startsAtOverride?.toISOString() ?? null,
    subjectName: quiz.subject.name,
    isPublic: quiz.isPublic,
    answerVisibility: quiz.answerVisibility,
    candidateAccessRequired: !quiz.isPublic && quiz.candidateAccessRequired,
    assignedClasses: quiz.assignments.map((assignment) => ({ id: assignment.classId, name: assignment.class.name })),
    questions: formattedQuestions,
  };

  return (
    <div className="w-full">
      <SingleQuizPlayer
        quiz={formattedQuiz as any}
        sessionUser={session ? { name: session.name, role: session.role } : null}
        skipRules={true}
        classId={classId ?? effectiveAssignment?.classId ?? null}
        className={assignedClassName}
      />
    </div>
  );
}
