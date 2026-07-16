/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherQuizManager from "@/components/TeacherQuizManager";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    redirect("/login");
  }

  const teacher = await db.teacherProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!teacher) {
    redirect("/login");
  }

  // Fetch quizzes created by this teacher
  const quizzes = await db.quiz.findMany({
    where: { teacherId: teacher.id },
    include: {
      subject: true,
      class: true,
      questions: true,
      submissions: {
        select: { score: true },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { id: "desc" },
  });

  const subjects = await db.subject.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch classes where the teacher is either form teacher or teaches schedules in them
  const schedules = await db.schedule.findMany({
    where: { teacherId: teacher.id },
    select: { classId: true }
  });
  const scheduledClassIds = schedules.map(s => s.classId);

  const classes = await db.class.findMany({
    where: {
      OR: [
        { formTeacherId: teacher.id },
        { id: { in: scheduledClassIds } }
      ]
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý đề thi &amp; bài test</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Thiết lập đề thi trắc nghiệm online, câu hỏi ôn tập, và công thức toán học LaTeX.
        </p>
      </div>

      <TeacherQuizManager quizzes={quizzes as any} subjects={subjects} classes={classes} />
    </div>
  );
}
