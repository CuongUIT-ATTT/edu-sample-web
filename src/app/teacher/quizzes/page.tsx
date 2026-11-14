/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { getQuizFileManagerList } from "@/actions/quizzes";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { teacherClassIds } from "@/lib/teacher-classes";
import { redirect } from "next/navigation";
import TeacherQuizManager from "@/components/TeacherQuizManager";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    redirect("/login");
  }

  const result = await getQuizFileManagerList();
  let loadError = !result.success;
  let candidateQuizIds: string[] = [];
  let quizzes: any[] = [];
  let subjects: any[] = [];
  let classes: any[] = [];

  try {
    const candidateQuizzes = await db.quiz.findMany({
      where: { id: { in: (result.data ?? []).map(q => q.id) }, candidateAccessRequired: true },
      select: { id: true },
    });
    candidateQuizIds = candidateQuizzes.map(q => q.id);

    const teacher = await db.teacherProfile.findUnique({
      where: { userId: session.userId },
      include: { subjects: true },
    });

    if (teacher) {
      // Fetch quizzes created by this teacher
      quizzes = edit ? await db.quiz.findMany({
        where: { teacherId: teacher.id, id: edit },
        include: {
          subject: true,
          class: true,
          assignments: { include: { class: true } },
          questions: true,
          submissions: {
            select: { score: true },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { id: "desc" },
      }) : [];

      // GV được chọn tất cả môn học trong hệ thống
      subjects = await db.subject.findMany({
        orderBy: { name: "asc" },
      });

      // Lớp GV phụ trách: chủ nhiệm HOẶC có dạy (scheduleSeries)
      const ownedClassIds = await teacherClassIds(session.userId);
      classes = await db.class.findMany({
        where: { id: { in: ownedClassIds } },
        orderBy: { name: "asc" },
      });
    }
    if (edit && quizzes.length === 0) loadError = true;
  } catch (error) {
    loadError = true;
    console.error("Prisma error in TeacherQuizzesPage:", error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý đề thi &amp; bài test</h1>
        <p className="font-caption text-ink-muted-80 mt-1">
          Thiết lập đề thi trắc nghiệm online, câu hỏi ôn tập, và công thức toán học LaTeX.
        </p>
      </div>

      <TeacherQuizManager candidateQuizIds={candidateQuizIds} key={edit ?? "list"} editQuiz={quizzes[0] ? JSON.parse(JSON.stringify(quizzes[0])) : undefined} listLoadError={loadError} subjectsLoadError={loadError} quizzes={(result.data ?? []) as any} subjects={subjects} classes={classes} />
    </div>
  );
}
